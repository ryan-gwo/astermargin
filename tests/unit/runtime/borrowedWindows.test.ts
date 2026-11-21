import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { beforeEach, expect, it, vi } from 'vitest';
import { AsterMarginUIFactory } from '../../../src/ui/ui';

vi.mock('../../../src/utils/prefs', () => ({ getPref: vi.fn() }));
vi.mock('../../../src/utils/locale', () => ({ getString: vi.fn(), getLocaleID: vi.fn() }));
vi.mock('../../../src/utils/keyboardManager', () => ({ KeyboardManager: vi.fn() }));

function main() {
    return {
        closed: false,
        __astermarginRuntime: { status: "ready" },
        ZoteroPane: {},
        Zotero_Tabs: {},
        openDialog: vi.fn(),
        AsterMarginReact: {
        renderWindowSidebar: vi.fn(), renderPreferencesWindow: vi.fn(), unmountFromElement: vi.fn(),
    },
    } as any;
}
let a: any, b: any;
beforeEach(() => {
    vi.restoreAllMocks();
    a = main(); b = main();
    vi.stubGlobal('Zotero', { getMainWindow: vi.fn(() => b), debug: vi.fn() });
    vi.spyOn(AsterMarginUIFactory, 'findAsterMarginWindow').mockReturnValue(undefined);
    vi.spyOn(AsterMarginUIFactory, 'findPreferencesWindow').mockReturnValue(undefined);
});

it.each(['preferences'])(
    'pins the %s owner at creation and closes it with that owner',
    kind => {
    const borrowed: any = { closed: false, close: vi.fn() };
    a.openDialog.mockReturnValue(borrowed);
    if (kind === 'chat') AsterMarginUIFactory.openAsterMarginWindow(a);
    else AsterMarginUIFactory.openPreferencesWindow('actions', '', 'action', a);
    expect(a.openDialog).toHaveBeenCalledOnce();
    expect(b.openDialog).not.toHaveBeenCalled();
    const args = a.openDialog.mock.calls[0][3];
    expect(args.ownerWindowRef.deref()).toBe(a);
    expect(borrowed.__astermarginOwnerWindowRef.deref()).toBe(a);
    vi.mocked(kind === 'chat' ? AsterMarginUIFactory.findAsterMarginWindow : AsterMarginUIFactory.findPreferencesWindow).mockReturnValue(borrowed);
    AsterMarginUIFactory.closeWindowsRenderedBy(b);
    expect(borrowed.close).not.toHaveBeenCalled();
    AsterMarginUIFactory.closeWindowsRenderedBy(a);
    expect(borrowed.close).toHaveBeenCalledOnce();
},
);

it.each(['chat', 'preferences'])('focusing an existing %s retains its original renderer', kind => {
    const borrowed: any = { closed: false, focus: vi.fn(), __astermarginOwnerWindowRef: new WeakRef(a) };
    vi.mocked(kind === 'chat' ? AsterMarginUIFactory.findAsterMarginWindow : AsterMarginUIFactory.findPreferencesWindow).mockReturnValue(borrowed);
    if (kind === 'chat') AsterMarginUIFactory.openAsterMarginWindow(b);
    else AsterMarginUIFactory.openPreferencesWindow('billing', undefined, undefined, b);
    expect(borrowed.focus).toHaveBeenCalledOnce();
    expect(borrowed.__astermarginOwnerWindowRef.deref()).toBe(a);
    expect(b.openDialog).not.toHaveBeenCalled();
});

it("reopens settings if the existing window's renderer has detached", () => {
    const stale = { closed: false, close: vi.fn(), focus: vi.fn(),
        __astermarginOwnerWindowRef: new WeakRef(a) };
    a.__astermarginRuntime.status = "closing";
    vi.mocked(AsterMarginUIFactory.findPreferencesWindow).mockReturnValue(stale as any);
    const replacement = { closed: false };
    b.openDialog.mockReturnValue(replacement);

    expect(AsterMarginUIFactory.openPreferencesWindow()).toBe(replacement);
    expect(stale.close).toHaveBeenCalledOnce();
    expect(stale.focus).not.toHaveBeenCalled();
    expect(b.openDialog).toHaveBeenCalledOnce();
});

for (const name of ["astermarginPreferences"]) {
    function chromePage(
        ownerRef?: WeakRef<any>,
        opener = a,
        initialization = Promise.resolve(),
    ) {
        const container = {};
        const win: any = {
            closed: false,
            opener,
            arguments: [{ ownerWindowRef: ownerRef }],
            addEventListener: vi.fn(),
        };
        win.close = vi.fn(() => {
            win.closed = true;
        });
        const context: any = {
            window: win,
            document: { getElementById: () => container },
            WeakRef,
            ChromeUtils: {
                importESModule: () => ({
                    Zotero: {
                        ...Zotero,
                        initializationPromise: initialization,
                        uiReadyPromise: Promise.resolve(),
                        UIProperties: { registerRoot: vi.fn() },
                    },
                }),
            },
        };
        runInNewContext(
            readFileSync(`addon/content/${name}.js`, "utf8"),
            context,
        );
        return { win, context, container };
    }
    it(`${name} renders and unmounts from its explicit owner despite foreign focus and opener`, async () => {
        const { win, context, container } = chromePage(new WeakRef(a), b);
        await context.onLoad();
        expect(win.__astermarginOwnerWindowRef.deref()).toBe(a);
        const render =
            name === "astermarginWindow"
                ? "renderWindowSidebar"
                : "renderPreferencesWindow";
        expect(a.AsterMarginReact[render]).toHaveBeenCalled();
        expect(b.AsterMarginReact[render]).not.toHaveBeenCalled();
        context.onUnload();
        expect(a.AsterMarginReact.unmountFromElement).toHaveBeenCalledWith(
            container,
        );
        expect(Zotero.getMainWindow).not.toHaveBeenCalled();
    });
    it(`${name} accepts a validated opener when no owner argument is supplied`, async () => {
        const { win, context } = chromePage();
        await context.onLoad();
        expect(win.__astermarginOwnerWindowRef.deref()).toBe(a);
    });
    it.each(["owner", "surface"])(
        `${name} does not mount after its %s closes during initialization`,
        async (kind) => {
            let ready!: () => void;
            const { win, context } = chromePage(
                new WeakRef(a),
                a,
                new Promise<void>((resolve) => {
                    ready = resolve;
                }),
            );
            const loading = context.onLoad();
            expect(win.__astermarginOwnerWindowRef.deref()).toBe(a);
            if (kind === "owner") a.closed = true;
            else win.close();
            ready();
            await loading;
            expect(a.AsterMarginReact.renderWindowSidebar).not.toHaveBeenCalled();
            expect(
                a.AsterMarginReact.renderPreferencesWindow,
            ).not.toHaveBeenCalled();
            expect(win.closed).toBe(true);
        },
    );
    it(`${name} never falls back from a closed explicit owner to a live opener`, async () => {
        a.closed = true;
        const { win, context } = chromePage(new WeakRef(a), b);
        await context.onLoad();
        expect(win.closed).toBe(true);
        expect(b.AsterMarginReact.renderWindowSidebar).not.toHaveBeenCalled();
        expect(b.AsterMarginReact.renderPreferencesWindow).not.toHaveBeenCalled();
    });
}

it("opens an independent standalone without borrowing its initiating renderer", () => {
    const standalone = { closed: false, close: vi.fn() } as any;
    const openWindow = vi.fn(() => standalone);
    vi.stubGlobal("Services", { ww: { openWindow } });
    AsterMarginUIFactory.openAsterMarginWindow(a);
    expect(openWindow).toHaveBeenCalledWith(
        a,
        "chrome://astermargin/content/astermarginWindow.xhtml",
        "astermargin-separate-window",
        expect.any(String),
        null,
    );
    expect(standalone.__astermarginOwnerWindowRef).toBeUndefined();
    vi.mocked(AsterMarginUIFactory.findAsterMarginWindow).mockReturnValue(standalone);
    AsterMarginUIFactory.closeWindowsRenderedBy(a, true);
    expect(standalone.close).not.toHaveBeenCalled();
});

it("boots the standalone through instance hooks without reading its opener", async () => {
    const loaded = vi.fn(),
        unloaded = vi.fn();
    const listeners: Record<string, (...args: any[]) => any> = {};
    const win = {
        closed: false,
        addEventListener: (name: string, fn: (...args: any[]) => any) => {
            listeners[name] = fn;
        },
    };
    const context = {
        window: win,
        document: { getElementById: () => ({ addEventListener: vi.fn() }) },
        Services: { scriptloader: { loadSubScript: vi.fn() } },
        ChromeUtils: {
            importESModule: () => ({
                Zotero: {
                    initializationPromise: Promise.resolve(),
                    UIProperties: { registerRoot: vi.fn() },
                    AsterMargin: {
                        data: { alive: true },
                        hooks: {
                            onStandaloneWindowLoad: loaded,
                            onStandaloneWindowUnload: unloaded,
                        },
                    },
                },
            }),
        },
    };
    runInNewContext(
        readFileSync("addon/content/astermarginWindow.js", "utf8"),
        context,
    );
    await listeners.load();
    expect(loaded).toHaveBeenCalledWith(win);
    listeners.unload();
    expect(unloaded).toHaveBeenCalledWith(win);
});

it("wires the standalone window's menu commands with listeners, not inline handlers", async () => {
    const xhtml = readFileSync("addon/content/astermarginWindow.xhtml", "utf8");
    expect(xhtml).not.toMatch(/\son[a-z]+=/);

    const commands: Record<string, () => void> = {};
    const listeners: Record<string, (...args: any[]) => any> = {};
    const handleWindowMenuCommand = vi.fn().mockResolvedValue(undefined);
    const win = {
        closed: false,
        close: vi.fn(),
        minimize: vi.fn(),
        AsterMarginReact: { handleWindowMenuCommand },
        addEventListener: (name: string, fn: (...args: any[]) => any) => {
            listeners[name] = fn;
        },
    };
    const context = {
        window: win,
        document: {
            getElementById: (id: string) => ({
                addEventListener: (name: string, fn: () => void) => {
                    if (name === "command") commands[id] = fn;
                },
            }),
        },
        Services: { scriptloader: { loadSubScript: vi.fn() } },
        ChromeUtils: {
            importESModule: () => ({
                Zotero: {
                    initializationPromise: Promise.resolve(),
                    UIProperties: { registerRoot: vi.fn() },
                    AsterMargin: { data: { alive: false }, hooks: {} },
                },
            }),
        },
    };
    runInNewContext(readFileSync("addon/content/astermarginWindow.js", "utf8"), context);
    await listeners.load();

    expect(Object.keys(commands).sort()).toEqual(
        ["cmd_astermarginNewChat", "cmd_astermarginSettings", "cmd_close", "minimizeWindow", "zoomWindow"],
    );
    commands.cmd_astermarginNewChat();
    commands.cmd_astermarginSettings();
    expect(handleWindowMenuCommand.mock.calls).toEqual([["new-chat"], ["settings"]]);
    commands.cmd_close();
    expect(win.close).toHaveBeenCalled();
    commands.minimizeWindow();
    expect(win.minimize).toHaveBeenCalled();
    // zoomWindow() exists only once macWindowMenu.js has loaded.
    expect(() => commands.zoomWindow()).not.toThrow();
});

it('pins a newly opened window before the window mediator can enumerate it', async () => {
    vi.mocked(AsterMarginUIFactory.findAsterMarginWindow).mockRestore();
    const standalone = { closed: false, focus: vi.fn(), __astermarginRuntime: { id: 'standalone', status: 'ready' } } as any;
    const dispatchWindowCommand = vi.fn().mockResolvedValue({ ok: true });
    (Zotero as any).AsterMargin = { runtime: { dispatchWindowCommand } };
    const openWindow = vi.fn(() => standalone);
    vi.stubGlobal('Services', {
        ww: { openWindow },
        wm: { getEnumerator: () => ({ hasMoreElements: () => false }) },
    });
    await Promise.all([
        AsterMarginUIFactory.commandAsterMarginWindow('inspect-runtime'),
        AsterMarginUIFactory.commandAsterMarginWindow('inspect-runtime'),
    ]);
    expect(openWindow).toHaveBeenCalledOnce();
    expect(dispatchWindowCommand).toHaveBeenCalledWith('inspect-runtime', { windowId: 'standalone' });
});
