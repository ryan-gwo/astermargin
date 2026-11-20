import { describe, expect, it } from 'vitest';
import { runErrorActionVisibility } from '../../../react/components/agentRuns/RunErrorDisplay';

function baseArgs(overrides: Partial<Parameters<typeof runErrorActionVisibility>[0]> = {}) {
    return {
        hasAsterMarginFallback: true,
        errorType: 'model_error',
        hasCredits: true,
        isLastRun: true,
        hasDefaultAsterMarginModel: true,
        localMode: false,
        ...overrides,
    };
}

describe('runErrorActionVisibility', () => {
    it('hides both hosted-fallback actions in local mode regardless of the error', () => {
        expect(runErrorActionVisibility(baseArgs({ localMode: true }))).toEqual({
            canTryWithAsterMargin: false,
            canGetAsterMarginCredits: false,
        });
        expect(runErrorActionVisibility(baseArgs({ localMode: true, hasCredits: false }))).toEqual({
            canTryWithAsterMargin: false,
            canGetAsterMarginCredits: false,
        });
    });

    it('offers "Try with AsterMargin" in cloud mode when the fallback is available and credits remain', () => {
        expect(runErrorActionVisibility(baseArgs())).toEqual({
            canTryWithAsterMargin: true,
            canGetAsterMarginCredits: false,
        });
    });

    it('offers "Get AsterMargin Credits" instead once credits run out', () => {
        expect(runErrorActionVisibility(baseArgs({ hasCredits: false }))).toEqual({
            canTryWithAsterMargin: false,
            canGetAsterMarginCredits: true,
        });
    });

    it('offers credits for a usage-limit error even without has_astermargin_fallback', () => {
        expect(runErrorActionVisibility(baseArgs({
            hasAsterMarginFallback: false,
            errorType: 'usage_limit_exceeded',
            hasCredits: false,
        }))).toEqual({ canTryWithAsterMargin: false, canGetAsterMarginCredits: true });
    });

    it('never offers "Try with AsterMargin" for a usage-limit error even with credits', () => {
        expect(runErrorActionVisibility(baseArgs({ errorType: 'usage_limit_exceeded' }))).toEqual({
            canTryWithAsterMargin: false,
            canGetAsterMarginCredits: false,
        });
    });

    it('hides "Try with AsterMargin" without a default AsterMargin model or on an older run', () => {
        expect(runErrorActionVisibility(baseArgs({ hasDefaultAsterMarginModel: false })).canTryWithAsterMargin).toBe(false);
        expect(runErrorActionVisibility(baseArgs({ isLastRun: false })).canTryWithAsterMargin).toBe(false);
    });
});
