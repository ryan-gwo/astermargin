import { getHostWindow } from '../runtime/windowRuntime';
/** Mark the independent standalone visible and stage its initial selection once. */

import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { store } from '../store';
import { getPref } from '../../src/utils/prefs';
import {
    isAsterMarginWindowOpenAtom,
    isLibraryTabAtom,
    isSidebarVisibleAtom,
    removePopupMessagesByTypeAtom,
} from '../atoms/ui';
import {
    currentMessageItemsAtom,
    updateMessageItemsFromZoteroSelectionAtom,
} from '../atoms/messageComposition';
import { isProfileLoadedAtom } from '../atoms/profile';
import { logger } from '@astermargin/agent-core/platform/logger';

export function useAsterMarginWindowContext() {
    const setIsAsterMarginWindowOpen = useSetAtom(isAsterMarginWindowOpenAtom);
    const isProfileLoaded = useAtomValue(isProfileLoadedAtom);
    const updateMessageItemsFromZoteroSelection = useSetAtom(updateMessageItemsFromZoteroSelectionAtom);
    const setCurrentMessageItems = useSetAtom(currentMessageItemsAtom);
    const removePopupMessagesByType = useSetAtom(removePopupMessagesByTypeAtom);
    const didAutoPopulateRef = useRef(false);

    useEffect(() => {
        setIsAsterMarginWindowOpen(true);
        return () => setIsAsterMarginWindowOpen(false);
    }, [setIsAsterMarginWindowOpen]);

    useEffect(() => {
        if (didAutoPopulateRef.current) return;
        if (!isProfileLoaded) return;
        didAutoPopulateRef.current = true;


        if (getHostWindow().__astermarginSkipInitialSelection) return;
        if (!getPref('addSelectedItemsOnOpen')) return;
        // Reader context is handled by useReaderTabSelection, which starts
        // tracking as soon as this window marks AsterMargin as visible.
        if (!store.get(isLibraryTabAtom)) return;

        logger('useAsterMarginWindowContext: staging Zotero selection for the separate window');
        setCurrentMessageItems([]);
        removePopupMessagesByType(['items_summary']);
        updateMessageItemsFromZoteroSelection(getPref('maxAddAttachmentToMessage'));
    }, [
        isProfileLoaded,
        setCurrentMessageItems,
        removePopupMessagesByType,
        updateMessageItemsFromZoteroSelection,
    ]);
}
