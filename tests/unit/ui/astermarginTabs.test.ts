// @vitest-environment jsdom
/**
 * The shared AsterMargin tab layer with more than one kind: hooks dispatch by
 * kind, lifecycle closes record every kind, and restore reopens each through
 * its own kind.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prefs = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../../../src/utils/prefs', () => ({
    getPref: (key: string) => prefs.get(key) ?? '',
    setPref: (key: string, value: unknown) => { prefs.set(key, value); },
}));

import {
    addAsterMarginTab,
    astermarginTabType,
    cleanupAsterMarginTabs,
    closeAsterMarginTabsForWindow,
    dropAsterMarginTabsFromSession,
    findAsterMarginTab,
    initAsterMarginTabs,
    isAsterMarginTabType,
    listAsterMarginTabs,
    registerAsterMarginTabKind,
    restoreAsterMarginTabs,
    type AsterMarginTabKind,
} from '../../../src/ui/astermarginTabs';
import { fakeWindow } from '../../helpers/fakeZoteroTabs';

interface NoteRef { id: string }
interface PageRef { url: string }

let windows: any[];
let quitObserver: any;
let session: { state: any; save: ReturnType<typeof vi.fn> };
let released: string[];

/** A kind whose product open adds (or reuses) its tab, as a real kind's does. */
function kind<Ref>(name: string, key: (ref: Ref) => string, fail: Set<string> = new Set()) {
    const definition: AsterMarginTabKind<Ref> = {
        kind: name,
        parseRef: (value) => (value && typeof value === 'object' && typeof key(value as Ref) === 'string' ? (value as Ref) : null),
        sameRef: (a, b) => key(a) === key(b),
        open: vi.fn(async (ref: Ref, options) => {
            if (fail.has(key(ref))) return { error: `${key(ref)} is gone` };
            if (!findAsterMarginTab(options.window, name, ref)) {
                addAsterMarginTab(options.window, {
                    kind: name,
                    ref,
                    title: `${name} ${key(ref)}`,
                    index: options.index,
                    background: options.background,
                    onRelease: () => released.push(`${name}:${key(ref)}`),
                });
            }
            return { ok: true as const };
        }),
    };
    return definition;
}

let notes: AsterMarginTabKind<NoteRef>;
let pages: AsterMarginTabKind<PageRef>;

function start(failPages: Set<string> = new Set()) {
    initAsterMarginTabs();
    notes = kind<NoteRef>('note', (ref) => ref.id);
    pages = kind<PageRef>('page', (ref) => ref.url, failPages);
    registerAsterMarginTabKind(notes);
    registerAsterMarginTabKind(pages);
}

function layout(win: any) {
    return win.Zotero_Tabs.getState().map((t: any) =>
        `${t.type}${t.data?.astermarginTab ? `:${JSON.stringify(t.data.astermarginTab.ref)}` : ''}${t.selected ? '*' : ''}`);
}

beforeEach(() => {
    vi.clearAllMocks();
    prefs.clear();
    released = [];
    windows = [fakeWindow()];
    session = { state: { windows: [] }, save: vi.fn(async () => {}) };
    (globalThis as any).Services = {
        wm: { addListener: vi.fn(), removeListener: vi.fn() },
        obs: { addObserver: vi.fn((o: any) => { quitObserver = o; }), removeObserver: vi.fn() },
    };
    Object.assign(Zotero as any, {
        getMainWindows: () => windows,
        Session: session,
        Promise: { delay: vi.fn(async () => {}) },
    });
    start();
});

afterEach(() => {
    cleanupAsterMarginTabs();
});

describe('AsterMargin tab kinds', () => {
    it('types every kind as astermargin-<kind>, which Zotero reads as the content type astermargin', () => {
        expect(astermarginTabType('note')).toBe('astermargin-note');
        expect(isAsterMarginTabType('astermargin-note')).toBe(true);
        expect(isAsterMarginTabType('astermargin-table')).toBe(true);
        expect(isAsterMarginTabType('reader')).toBe(false);
        expect(() => registerAsterMarginTabKind({ ...kind('x', () => ''), kind: 'two-parts' })).toThrow(/Invalid/);
    });

    it('adds a tab with its kind and ref in the data and a astermargin-pane root', async () => {
        const win = windows[0];
        await notes.open({ id: 'N1' }, { window: win });
        const [tab] = listAsterMarginTabs('note');
        expect(win.Zotero_Tabs.tabs[1]).toMatchObject({ type: 'astermargin-note', data: { astermarginTab: { kind: 'note', ref: { id: 'N1' } } } });
        expect(tab.pane.id).toBe(`astermargin-pane-note-${tab.tabID}`);
        expect(tab.pane.classList.contains('astermargin-root')).toBe(true);
        expect(listAsterMarginTabs('page')).toEqual([]);
    });

    it('reopens a closed tab through its own kind on undo-close', async () => {
        const undo = windows[0].Zotero_Tabs.tabHooks.undoClose.astermargin;
        await undo({ data: { astermarginTab: { kind: 'page', ref: { url: 'u1' } } } }, 2);
        expect(pages.open).toHaveBeenCalledWith({ url: 'u1' }, { window: windows[0], index: 2 });
        expect(notes.open).not.toHaveBeenCalled();
        // An unknown kind or a malformed ref opens nothing.
        await undo({ data: { astermarginTab: { kind: 'chart', ref: {} } } }, 2);
        await undo({ data: { astermarginTab: { kind: 'note', ref: 'N1' } } }, 2);
        expect(notes.open).not.toHaveBeenCalled();
    });

    it('releases the kind\'s content when its tab closes', async () => {
        const win = windows[0];
        await notes.open({ id: 'N1' }, { window: win });
        win.Zotero_Tabs.close(listAsterMarginTabs()[0].tabID);
        expect(released).toEqual(['note:N1']);
        expect(win.document.querySelector('.astermargin-tab')).toBeNull();
    });

    it('strips every kind from the in-memory session', () => {
        session.state = { windows: [{ type: 'pane', tabs: [{ type: 'library' }, { type: 'astermargin-note' }, { type: 'reader' }, { type: 'astermargin-page' }] }] };
        expect(dropAsterMarginTabsFromSession()).toBe(true);
        expect(session.state.windows[0].tabs.map((t: any) => t.type)).toEqual(['library', 'reader']);
    });

    it('remembers tabs of every kind on quit and reopens each through its kind, in place, with the selection', async () => {
        const win = windows[0];
        win.Zotero_Tabs.add({ type: 'reader', data: { itemID: 7 } });
        await notes.open({ id: 'N1' }, { window: win, background: true });
        await pages.open({ url: 'u1' }, { window: win });
        quitObserver.observe();
        expect(layout(win)).toEqual(['library*', 'reader']);
        expect(JSON.parse(prefs.get('astermarginTabsToRestore') as string).windows[0].tabs).toEqual([
            { kind: 'note', ref: { id: 'N1' }, index: 2, selected: false },
            { kind: 'page', ref: { url: 'u1' }, index: 3, selected: true },
        ]);

        cleanupAsterMarginTabs();
        start();
        await expect(restoreAsterMarginTabs(win)).resolves.toBe(2);

        expect(layout(win)).toEqual(['library', 'reader', 'astermargin-note:{"id":"N1"}', 'astermargin-page:{"url":"u1"}*']);
        expect(prefs.get('astermarginTabsToRestore')).toBe('');
    });

    it('skips a tab whose kind is no longer registered or whose content is gone, keeping the rest in place', async () => {
        const win = windows[0];
        win.Zotero_Tabs.add({ type: 'reader', data: { itemID: 7 } });
        await pages.open({ url: 'gone' }, { window: win, background: true });
        await notes.open({ id: 'N1' }, { window: win, background: true });
        win.Zotero_Tabs.add({ type: 'reader', data: { itemID: 8 } });
        await pages.open({ url: 'u2' }, { window: win, background: true });
        closeAsterMarginTabsForWindow(win);

        cleanupAsterMarginTabs();
        // The next version has no `note` kind, and the first page went away.
        initAsterMarginTabs();
        pages = kind<PageRef>('page', (ref) => ref.url, new Set(['gone']));
        registerAsterMarginTabKind(pages);
        await expect(restoreAsterMarginTabs(win)).resolves.toBe(1);

        expect(layout(win)).toEqual(['library*', 'reader', 'reader', 'astermargin-page:{"url":"u2"}']);
    });
});
