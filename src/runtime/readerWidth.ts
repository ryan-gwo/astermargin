/**
 * Earlier plugin versions wrapped `Zotero.Reader.onChangeSidebarWidth`. AsterMargin
 * no longer does, but a wrapper left in that app-lifetime slot by an earlier
 * version, or by a plugin generation that did not shut down cleanly, pins the
 * compartment it came from until something removes it.
 */

/**
 * Property stashed on the AsterMargin-authored `Zotero.Reader.onChangeSidebarWidth`
 * wrapper, holding whatever handler was installed before it (or null — core
 * initializes the slot to null and nothing else assigns it).
 */
const ORIGINAL_HANDLER_PROP = '__astermarginOriginalSidebarWidthHandler';

type ReaderWidthHandler = (...args: any[]) => void;

/**
 * Wrappers installed by plugin versions that predate ORIGINAL_HANDLER_PROP
 * carry no marker and keep their original in instance state we cannot reach.
 * They are identified by two property accesses in their source (property
 * names survive minification). Since Zotero core initializes the slot to
 * null and nothing but AsterMargin assigns it, a legacy chain safely resolves to
 * null — letting an update reclaim compartments pinned by older versions.
 */
function isLegacyAsterMarginWrapper(fn: unknown): boolean {
    if (typeof fn !== 'function') {
        return false;
    }
    try {
        const src = Function.prototype.toString.call(fn);
        return src.includes('originalOnChangeSidebarWidth')
            && src.includes('enforceConsistentWidth');
    } catch (e) {
        return false;
    }
}

/**
 * Walk a chain of AsterMargin-authored wrappers down to the true original handler.
 * Returns null when the chain bottoms out at null/non-function, at a legacy
 * AsterMargin wrapper (see isLegacyAsterMarginWrapper), or when a wrapper from a
 * torn-down window realm can no longer be inspected — the only handler ever
 * underneath ours is core's initial null, so null is safe.
 */
export function unwrapReaderWidthHandler(handler: unknown): ReaderWidthHandler | null {
    try {
        let current: any = handler;
        while (typeof current === 'function' && ORIGINAL_HANDLER_PROP in current) {
            current = current[ORIGINAL_HANDLER_PROP];
        }
        if (isLegacyAsterMarginWrapper(current)) {
            return null;
        }
        return typeof current === 'function' ? current : null;
    } catch (e) {
        return null;
    }
}

/**
 * If a AsterMargin wrapper (installed by any bundle copy or plugin generation) is
 * present on `Zotero.Reader.onChangeSidebarWidth`, restore the original
 * handler so the wrapper's closure — and the compartment it pins — can be
 * garbage-collected. Safe to call repeatedly and from either bundle.
 */
export function restoreReaderSidebarWidthHandler(): void {
    try {
        const reader = Zotero?.Reader as any;
        if (!reader) {
            return;
        }
        const current = reader.onChangeSidebarWidth;
        if (
            typeof current === 'function'
            && (ORIGINAL_HANDLER_PROP in current || isLegacyAsterMarginWrapper(current))
        ) {
            reader.onChangeSidebarWidth = unwrapReaderWidthHandler(current);
        }
    } catch (e) {
        // Best-effort — never break shutdown.
    }
}

