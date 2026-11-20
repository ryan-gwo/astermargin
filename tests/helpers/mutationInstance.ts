import { LibraryOperations } from '../../src/services/libraryOperations';
import { LibraryMutations } from '../../src/services/libraryMutations';
import { NotePreviews } from '../../src/services/notePreviews';

/** Install real instance coordination in tests that replace the Zotero singleton. */
export function installMutationInstance() {
    const zotero = (globalThis as any).Zotero;
    zotero.Items ??= {};
    zotero.Items.getIDFromLibraryAndKey ??= () => undefined;
    zotero.AsterMargin ??= {};
    zotero.AsterMargin.data ??= { env: "production" };
    zotero.AsterMargin.libraryOperations = new LibraryOperations();
    zotero.AsterMargin.mutations = new LibraryMutations();
    zotero.AsterMargin.notePreviews = new NotePreviews();
    zotero.AsterMargin.libraryScopeInitialized = true;
    zotero.AsterMargin.searchableLibraryIds = [1, 2];
}
