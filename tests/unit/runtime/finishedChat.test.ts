import { beforeEach, expect, it, vi } from 'vitest';
import { isFinishedChat } from '../../../src/services/threads/finishedChat';
import { AsterMarginUIFactory } from '../../../src/ui/ui';

const state = vi.hoisted(() => ({ history: vi.fn(), claims: [] as any[], generation: 1 }));
vi.mock('@astermargin/agent-core/transport/agentService', () => ({
    agentRunService: { getThreadActivity: (...args: unknown[]) => state.history(...args) },
}));
vi.mock('../../../src/utils/prefs', () => ({ getPref: vi.fn() }));
vi.mock('../../../src/utils/locale', () => ({ getString: vi.fn(), getLocaleID: vi.fn() }));
vi.mock('../../../src/utils/keyboardManager', () => ({ KeyboardManager: vi.fn() }));

const idle = { activity: { state: 'idle', run_id: null }, tail_run_id: null, runs: [] };
const dispatch = vi.fn();
let win: any;
beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    state.claims = [];
    state.generation = 1;
    state.history.mockReset().mockResolvedValue(idle);
    dispatch.mockResolvedValue({ ok: true });
    win = { closed: false, focus: vi.fn(), __astermarginRuntime: { id: 'standalone', status: 'ready' } };
    (Zotero as any).AsterMargin = {
        presence: { getSnapshot: () => ({ claims: state.claims }) },
        account: { getSnapshot: () => ({ generation: state.generation }) },
        runtime: { dispatchWindowCommand: dispatch },
    };
});

it.each(['active', 'expired', 'unknown', undefined])('refuses activity %s as unfinished', async activity => {
    state.history.mockResolvedValue({ activity: activity ? { state: activity } : undefined });
    expect(await isFinishedChat('requested')).toBe(false);
});
it('does not treat a failed server read as completion', async () => {
    state.history.mockRejectedValue(new Error('offline'));
    expect(await isFinishedChat('requested')).toBe(false);
});
it('never treats a local-mode thread as finished, and never reads the backend', async () => {
    (Zotero as any).AsterMargin.localMode = true;
    expect(await isFinishedChat('requested')).toBe(false);
    expect(state.history).not.toHaveBeenCalled();
});
it('rejects a writer acquired while history was loading', async () => {
    state.history.mockImplementation(async () => {
        state.claims.push({ threadId: 'requested' });
        return idle;
    });
    expect(await isFinishedChat('requested')).toBe(false);
});
it('guards the command before opening a window', async () => {
    const open = vi.spyOn(AsterMarginUIFactory, 'openAsterMarginWindow').mockReturnValue(win);
    state.claims.push({ threadId: 'requested' });
    expect(await AsterMarginUIFactory.commandAsterMarginWindow('open-chat', { threadId: 'requested' })).toMatchObject({ ok: false });
    expect(open).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
});
it('rechecks requested activity after opening and readiness', async () => {
    vi.spyOn(AsterMarginUIFactory, 'openAsterMarginWindow').mockReturnValue(win);
    state.history.mockResolvedValueOnce(idle).mockResolvedValueOnce({ activity: { state: 'active' } });
    expect(await AsterMarginUIFactory.commandAsterMarginWindow('open-chat', { threadId: 'requested' })).toMatchObject({ ok: false });
    expect(dispatch).not.toHaveBeenCalled();
});
it('marks a newly created explicit-chat window before its renderer mounts', async () => {
    vi.spyOn(AsterMarginUIFactory, 'findAsterMarginWindow').mockReturnValue(undefined);
    vi.stubGlobal('Services', { ww: { openWindow: vi.fn(() => win) } });
    expect(await AsterMarginUIFactory.commandAsterMarginWindow('open-chat', { threadId: 'requested' })).toMatchObject({ ok: true });
    expect(win.__astermarginSkipInitialSelection).toBe(true);
    expect(dispatch).toHaveBeenCalledWith('open-chat', { threadId: 'requested', windowId: 'standalone' });
});
it('ordinary window commands preserve access without requiring chat settlement', async () => {
    vi.spyOn(AsterMarginUIFactory, 'openAsterMarginWindow').mockReturnValue(win);
    expect(await AsterMarginUIFactory.commandAsterMarginWindow('inspect-runtime')).toMatchObject({ ok: true });
    expect(state.history).not.toHaveBeenCalled();
});
it('does not deliver the command after account replacement during readiness', async () => {
    vi.spyOn(AsterMarginUIFactory, 'openAsterMarginWindow').mockImplementation(() => { state.generation++; return win; });
    expect(await AsterMarginUIFactory.commandAsterMarginWindow('open-chat', { threadId: 'requested' })).toMatchObject({ ok: false });
    expect(dispatch).not.toHaveBeenCalled();
});

it('suppresses delayed initial selection in an already opened window', async () => {
    vi.spyOn(AsterMarginUIFactory, 'findAsterMarginWindow').mockReturnValue(win);
    await AsterMarginUIFactory.commandAsterMarginWindow('open-chat', { threadId: 'requested' });
    expect(win.__astermarginSkipInitialSelection).toBe(true);
    AsterMarginUIFactory.openAsterMarginWindow();
    expect(win.__astermarginSkipInitialSelection).toBe(true);
});
