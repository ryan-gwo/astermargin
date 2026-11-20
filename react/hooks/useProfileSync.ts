import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { store } from '../store';
import { isAsterMarginUIVisibleAtom, isPreferencePageVisibleAtom } from '../atoms/ui';
import { prefWindowFocusRefreshAtom, errorCreditCheckAtom } from '../atoms/profile';
import { tryGetWindowRuntime } from '../runtime/windowRuntime';

export const triggerProfileRefresh = () => Zotero.AsterMargin.account?.refresh(true);

/**
 * Report whether this renderer shows AsterMargin, so the instance account can refresh
 * the profile often while AsterMargin is in use and rarely while it is hidden.
 */
export function useReportAsterMarginUIVisibility() {
    const visible = useAtomValue(isAsterMarginUIVisibleAtom);
    useEffect(() => {
        const key = tryGetWindowRuntime()?.id;
        const account = Zotero.AsterMargin.account;
        if (!key || !account) return;
        account.setUIVisible(key, visible);
        return () => account.setUIVisible(key, false);
    }, [visible]);
}

/** Window visibility and explicit UI signals request the instance's single pipeline. */
export function useProfileSync() {
    useReportAsterMarginUIVisibility();

    const preferences = useAtomValue(isPreferencePageVisibleAtom);
    useEffect(() => {
        if (preferences) void triggerProfileRefresh();
    }, [preferences]);

    // One-shot signals: clearing a flag re-runs this effect with every flag false,
    // so each signal requests exactly one refresh.
    const focus = useAtomValue(prefWindowFocusRefreshAtom);
    const credit = useAtomValue(errorCreditCheckAtom);
    useEffect(() => {
        if (!focus && !credit) return;
        if (focus) store.set(prefWindowFocusRefreshAtom, false);
        if (credit) store.set(errorCreditCheckAtom, false);
        void triggerProfileRefresh();
    }, [focus, credit]);

    return { refreshProfile: (force = false) => Zotero.AsterMargin.account?.refresh(force) };
}
