import { useEffect } from 'react';
import { eventManager } from '../events/eventManager';
import { AsterMarginEventName, AsterMarginEventDetail } from '../events/types';

export function useEventSubscription<T extends AsterMarginEventName>(
    eventName: T,
    callback: (detail: AsterMarginEventDetail<T>) => void,
    deps: any[] = []
) {
    useEffect(() => {
        const unsubscribe = eventManager.subscribe(eventName, callback);
        return unsubscribe;
    }, [eventName, ...deps]);
} 