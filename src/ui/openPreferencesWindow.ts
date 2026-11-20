import { AsterMarginUIFactory } from './ui';
import { PreferencePageTab } from '../../react/atoms/ui';
import { ActionCategoryFilter } from '@astermargin/agent-core/types/actions';

/**
 * Open AsterMargin preferences in a separate window.
 * If a window already exists, it will be focused and switched to the given tab.
 * `actionsCategoryFilter` requests that the Actions tab pre-filter its list to
 * that category (or "uncategorized"). `actionId` requests that the Actions tab
 * reveal that action and open it in edit mode.
 */
export function openPreferencesWindow(tab?: PreferencePageTab, actionsCategoryFilter?: ActionCategoryFilter, actionId?: string, window?: Window): void {
    AsterMarginUIFactory.openPreferencesWindow(tab, actionsCategoryFilter, actionId, window);
}
