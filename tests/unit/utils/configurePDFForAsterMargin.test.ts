/**
 * Tests for the AsterMargin-side PDF package adapter, focused on the realm-safe
 * timer wiring: the package's internal watchdogs must schedule through
 * `Timer.sys.mjs` (system-global timers that survive window close/reopen),
 * not the bundle realm's `setTimeout`. Dropping that wiring would leave the
 * package on window-bound timers, which silently stop firing when the
 * creating window closes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configurePDFForAsterMargin } from '../../../src/utils/configurePDFForAsterMargin';
import { getConfig } from '../../../src/astermargin-extract/config';

describe('configurePDFForAsterMargin realm-safe timers', () => {
    afterEach(() => {
        delete (globalThis as any).ChromeUtils;
    });

    it('wires watchdog timers to Timer.sys.mjs when ChromeUtils is available', () => {
        const systemSetTimeout = vi.fn(() => 123);
        const systemClearTimeout = vi.fn();
        const importESModule = vi.fn(() => ({
            setTimeout: systemSetTimeout,
            clearTimeout: systemClearTimeout,
        }));
        (globalThis as any).ChromeUtils = { importESModule };

        configurePDFForAsterMargin();

        expect(importESModule).toHaveBeenCalledWith(
            'resource://gre/modules/Timer.sys.mjs',
        );
        const timers = getConfig().timers;
        expect(timers).toBeDefined();

        const callback = () => {};
        const id = timers!.setTimeout(callback, 500);
        expect(systemSetTimeout).toHaveBeenCalledWith(callback, 500);
        expect(id).toBe(123);

        timers!.clearTimeout(id);
        expect(systemClearTimeout).toHaveBeenCalledWith(123);
    });

    it('leaves timers unset when ChromeUtils is unavailable', () => {
        delete (globalThis as any).ChromeUtils;

        configurePDFForAsterMargin();

        expect(getConfig().timers).toBeUndefined();
    });
});
