/** Capture instance ownership before asynchronous work; token refresh keeps it valid. */
export function captureAccountGuard(expectedUserId?: string): () => boolean {
    const account = Zotero.AsterMargin?.account;
    const generation = account?.getGeneration();
    const userId = expectedUserId ?? account?.getSnapshot().session?.user.id;
    return () => Zotero.AsterMargin?.account === account
        && account?.getGeneration() === generation
        && account?.getSnapshot().session?.user.id === userId;
}
