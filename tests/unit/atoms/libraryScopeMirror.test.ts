import { afterEach, describe, expect, it } from 'vitest';
import { isLibraryInScope, isLibraryScopeKnown } from '../../../src/services/libraryScope';
afterEach(() => { (Zotero as any).AsterMargin = undefined; });
describe('instance library scope readers', () => {
    it('fails closed before instance scope initialization, even with leftover ids', () => {
        (Zotero as any).AsterMargin = { libraryScopeInitialized: false, searchableLibraryIds: [1] };
        expect(isLibraryScopeKnown()).toBe(false);
        expect(isLibraryInScope(1)).toBe(false);
    });
    it('uses the authoritative ids after initialization', () => {
        (Zotero as any).AsterMargin = { libraryScopeInitialized: true, searchableLibraryIds: [2] };
        expect(isLibraryScopeKnown()).toBe(true);
        expect(isLibraryInScope(1)).toBe(false);
        expect(isLibraryInScope(2)).toBe(true);
    });
    it('distinguishes a known empty scope from missing initialization', () => {
        (Zotero as any).AsterMargin = { libraryScopeInitialized: true, searchableLibraryIds: [] };
        expect(isLibraryScopeKnown()).toBe(true);
        expect(isLibraryInScope(1)).toBe(false);
    });
});
