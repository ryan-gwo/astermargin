/**
 * Pure helpers behind the preferences sidebar's tab list. Kept free of React
 * and Jotai so the visibility/redirect decisions are testable without a
 * component-rendering harness.
 */

import type { PreferencePageTab } from '../../atoms/ui';

export type VisiblePreferencePageTab = Exclude<PreferencePageTab, 'account'>;

/**
 * Legacy billing remains resolvable for upgrades, but is no longer exposed in
 * the settings navigation. The About tab owns release information instead.
 */
const LOCAL_MODE_HIDDEN_TABS: ReadonlySet<VisiblePreferencePageTab> = new Set(['billing']);

/** Whether a preference tab should appear in the sidebar for the given mode. */
export function isPreferenceTabVisible(tabId: VisiblePreferencePageTab, localMode: boolean): boolean {
    return !(localMode && LOCAL_MODE_HIDDEN_TABS.has(tabId));
}

/**
 * Resolves a requested tab — which may be the legacy "account" alias or
 * billing tab — to one that's actually shown, falling
 * back to General.
 */
export function resolvePreferenceTab(tab: PreferencePageTab, localMode: boolean): VisiblePreferencePageTab {
    if (tab === 'account' || (tab === 'billing' && localMode)) {
        return 'general';
    }
    return isPreferenceTabVisible(tab, localMode) ? tab : 'general';
}
