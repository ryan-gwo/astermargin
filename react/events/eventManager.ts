import { getHostWindow } from '../runtime/windowRuntime';
import { AsterMarginEventName, AsterMarginEventDetail } from './types';

class EventManager {
    private static instance: EventManager;

    // The renderer owns this bus; non-Zotero hosts can inject their own resolver.
    private disposed = false;
    private subscriptions = new Set<() => void>();
    private resolveWindow: () => Window = () => getHostWindow();

    private constructor() {}

    static getInstance(): EventManager {
        if (!this.instance) {
            this.instance = new EventManager();
        }
        return this.instance;
    }

    setWindowResolver(resolver: () => Window) {
        this.resolveWindow = resolver;
    }

    getEventBus(win: Window): EventTarget {
        if (!win.__astermarginEventBus) {
            win.__astermarginEventBus = new win.EventTarget();
        }
        return win.__astermarginEventBus;
    }

    dispatch<T extends AsterMarginEventName>(
        eventName: T,
        detail: AsterMarginEventDetail<T>,
        target?: Window,
    ) {
        if (this.disposed) return;
        const win = target ?? this.resolveWindow();
        if (win.__astermarginRuntime?.status === 'closing') return;
        const event = new win.CustomEvent(eventName, { detail });
        this.getEventBus(win).dispatchEvent(event);
    }

    subscribe<T extends AsterMarginEventName>(
        eventName: T,
        callback: (detail: AsterMarginEventDetail<T>) => void
    ): () => void {
        if (this.disposed) return () => {};
        const win = this.resolveWindow();
        const eventBus = this.getEventBus(win);
        
        const handler = (e: CustomEvent) => {
            if (win.__astermarginRuntime?.status !== 'closing') callback(e.detail);
        };
        eventBus.addEventListener(eventName, handler as EventListener);
        
        const unsubscribe = () => {
            eventBus.removeEventListener(eventName, handler as EventListener);
            this.subscriptions.delete(unsubscribe);
        };
        this.subscriptions.add(unsubscribe);
        return unsubscribe;
    }
    dispose(): void {
        this.disposed = true;
        for (const unsubscribe of this.subscriptions) unsubscribe();
        this.subscriptions.clear();
    }
}

export const eventManager = EventManager.getInstance(); 