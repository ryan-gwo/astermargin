/**
 * Live tests for which AsterMargin surface makes reader context available.
 *
 * Reader tracking is local to each renderer and follows its main-window context. It is mounted once
 * globally and gated on "any AsterMargin surface is open", so the separate AsterMargin
 * window gets the same reader context the sidebar does — the open attachment,
 * its page and content kind, and the reader's library — and neither surface's
 * own mount owns it. These tests drive that through dev endpoints:
 *   - `/astermargin/test/astermargin-window` / `/astermargin/test/astermargin-sidebar` to open and
 *     close each surface.
 *   - `/astermargin/test/select-tab` to open the reader tab under test.
 *   - `/astermargin/test/application-state` to read what a run would send.
 *
 * Prerequisites (per tests/README.md):
 *   - Dev build of AsterMargin loaded in a running Zotero (NODE_ENV=development).
 *   - Logged in with the profile loaded — reader tracking is gated on library
 *     access being ready, so the suite skips without it.
 *   - The `SMALL_PDF` fixture present in a library that is not excluded in
 *     AsterMargin Preferences.
 *
 * Side effects: opens a reader tab, and toggles both AsterMargin surfaces. Both
 * surfaces are closed again in teardown.
 *
 * Run with: `npm run test:live -- astermarginWindowContext`
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { isZoteroAvailable, skipIfNoZotero } from '../helpers/zoteroAvailability';
import { SMALL_PDF } from '../helpers/fixtures';
import {
    applicationState,
    closeAllSurfaces,
    getExclusionState,
    selectReaderTab,
    setAsterMarginSidebar,
    setAsterMarginWindow,
    type ApplicationStateResponse,
} from '../helpers/astermarginSurfaces';

/**
 * Each test drives several surface/tab transitions, each with its own settle
 * budget, so the suite needs far more than the live config's default timeout.
 */
const TEST_TIMEOUT_MS = 120000;

let available = false;
beforeAll(async () => {
    available = await isZoteroAvailable();
    if (!available) return;
    // Open the fixture once up front: the first open of a PDF in a session
    // drags in work that competes with everything else on Zotero's main
    // thread, which would otherwise be charged to whichever test ran first.
    await selectReaderTab(SMALL_PDF).catch(() => undefined);
}, 240000);

afterAll(async () => {
    if (!available) return;
    // Never leave a surface open for the next suite / the user.
    await closeAllSurfaces().catch(() => undefined);
});

/**
 * Put the instance in the state every test here starts from: both surfaces
 * closed, with the fixture's reader tab selected.
 *
 * Skips (rather than fails) when the instance cannot exercise the path — no
 * profile means reader tracking never starts, and a missing fixture means there
 * is no reader to track.
 */
async function openReaderWithAsterMarginClosed(ctx: any): Promise<void> {
    const { has_profile: hasProfile } = await getExclusionState();
    if (!hasProfile) {
        ctx.skip('AsterMargin profile is not loaded; log in to run the reader-context tests');
    }
    await closeAllSurfaces();
    const tab = await selectReaderTab(SMALL_PDF);
    if (!tab.ok) {
        ctx.skip(`Could not open the reader tab for ${SMALL_PDF.description}: ${tab.error ?? 'unknown'}`);
    }
}

/** Assert the full reader context for the fixture is present and coherent. */
function expectFixtureReaderContext(state: ApplicationStateResponse): void {
    expect(state.context_atoms.reader_attachment).toEqual({
        library_id: SMALL_PDF.library_id,
        zotero_key: SMALL_PDF.zotero_key,
    });
    expect(state.application_state.current_view).toBe('file_reader');
    expect(state.application_state.reader_state).toMatchObject({
        library_id: SMALL_PDF.library_id,
        zotero_key: SMALL_PDF.zotero_key,
        content_kind: 'pdf',
    });
    expect(state.application_state.reader_state?.current_page).toBeGreaterThan(0);
    // In reader view the current library is taken from the reader attachment.
    expect(state.application_state.current_library?.library_id).toBe(SMALL_PDF.library_id);
}

/** Assert no reader context is reported at all. */
function expectNoReaderContext(state: ApplicationStateResponse): void {
    expect(state.context_atoms.reader_attachment).toBeNull();
    expect(state.context_atoms.reader_text_selection).toBeNull();
    expect(state.application_state.reader_state).toBeUndefined();
}

describe('reader context and AsterMargin surfaces', () => {
    beforeEach((ctx) => {
        skipIfNoZotero(ctx, available);
    });

    it('reports no reader context while no AsterMargin surface is open', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);

        const state = await applicationState();
        expect(state.surfaces.astermargin_ui_visible).toBe(false);
        // The reader tab is open and selected — only the closed surfaces keep
        // tracking off.
        expect(state.application_state.current_view).toBe('file_reader');
        expectNoReaderContext(state);
    }, TEST_TIMEOUT_MS);

    it('tracks the reader when only the separate window is open', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);

        const opened = await setAsterMarginWindow(true);
        expect(opened.surfaces).toMatchObject({
            window_open: true,
            sidebar_visible: false,
            astermargin_ui_visible: true,
        });
        expect(opened.reader_context_settled).toBe(true);
        // The standalone owns its renderer and reads context from the main window.
        expect(opened.owner_is_main_window).toBe(false);

        expectFixtureReaderContext(await applicationState(opened.window_id ?? undefined));
    }, TEST_TIMEOUT_MS);

    it('tracks the reader when only the sidebar is open', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);

        const opened = await setAsterMarginSidebar(true);
        expect(opened.surfaces).toMatchObject({
            sidebar_visible: true,
            window_open: false,
            astermargin_ui_visible: true,
        });
        expect(opened.reader_context_settled).toBe(true);

        expectFixtureReaderContext(await applicationState());
    }, TEST_TIMEOUT_MS);

    it('clears reader context when the only open surface closes', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);
        await setAsterMarginWindow(true);

        const closed = await setAsterMarginWindow(false);
        expect(closed.surfaces.window_open).toBe(false);
        expect(closed.surfaces.astermargin_ui_visible).toBe(false);
        expect(closed.reader_context_settled).toBe(true);

        expectNoReaderContext(await applicationState());
    }, TEST_TIMEOUT_MS);

    it('keeps reader context when one surface closes while the other stays open', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);
        await setAsterMarginSidebar(true);
        await setAsterMarginWindow(true);

        const closed = await setAsterMarginWindow(false);
        expect(closed.surfaces).toMatchObject({
            window_open: false,
            sidebar_visible: true,
            astermargin_ui_visible: true,
        });
        expect(closed.reader_context_settled).toBe(true);

        // Tracking is keyed to "any surface open", so the sidebar keeps it alive.
        expectFixtureReaderContext(await applicationState());
    }, TEST_TIMEOUT_MS);

    it('picks up a reader that was already open when the window opens', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);
        // The reader tab was selected before any surface opened, so there is no
        // tab notification to react to — tracking must initialize from the
        // already-selected tab.
        const opened = await setAsterMarginWindow(true);
        expect(opened.reader_context_settled).toBe(true);

        expectFixtureReaderContext(await applicationState(opened.window_id ?? undefined));
    }, TEST_TIMEOUT_MS);

    it('is idempotent when the window is opened twice', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);
        await setAsterMarginWindow(true);

        const again = await setAsterMarginWindow(true);
        expect(again.ok).toBe(true);
        expect(again.surfaces.window_open).toBe(true);
        expect(again.reader_context_settled).toBe(true);
        expect(again.owner_is_main_window).toBe(false);

        expectFixtureReaderContext(await applicationState(again.window_id ?? undefined));
    }, TEST_TIMEOUT_MS);

    it('is a no-op when a surface is closed while already closed', async (ctx) => {
        await openReaderWithAsterMarginClosed(ctx);

        const window = await setAsterMarginWindow(false);
        expect(window.ok).toBe(true);
        expect(window.surfaces.window_open).toBe(false);
        // No window means no owner to report.
        expect(window.owner_is_main_window).toBeNull();

        const sidebar = await setAsterMarginSidebar(false);
        expect(sidebar.ok).toBe(true);
        expect(sidebar.surfaces.sidebar_visible).toBe(false);

        expectNoReaderContext(await applicationState());
    }, TEST_TIMEOUT_MS);
});
