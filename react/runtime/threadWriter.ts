import type { ThreadClaim } from "../../src/services/threads/threadPresence";
import { tryGetWindowRuntime } from "./windowRuntime";

export interface WriterLease {
    claim: ThreadClaim;
    preparing: number;
    /** The admission read in flight for this lease; resolves to whether writes may proceed. */
    admission?: Promise<boolean>;
}
let lease: WriterLease | undefined;
let draftSeq = 0;
export function currentWriter(): WriterLease | undefined {
    return lease;
}
export function ownsWriter(value: WriterLease | undefined): boolean {
    if (!value) return !Zotero.AsterMargin?.presence;
    return (
        lease === value &&
        !!tryGetWindowRuntime() &&
        Zotero.AsterMargin.presence.owns(value.claim)
    );
}
export function acquireWriter(
    threadId: string | null,
    generation: number,
): WriterLease | null | undefined {
    // Pure atom tests and hosts without the Zotero instance do not participate.
    if (!Zotero.AsterMargin?.presence) return undefined;
    const runtime = tryGetWindowRuntime();
    if (!runtime) return null;
    if (
        lease &&
        ownsWriter(lease) &&
        (!threadId || lease.claim.threadId === threadId)
    )
        return lease;
    const claim = Zotero.AsterMargin.presence.claim(
        runtime.id,
        threadId ?? `draft:${runtime.id}:${++draftSeq}`,
        generation,
    );
    if (!claim) return null;
    lease = { claim, preparing: 0 };
    return lease;
}
export function bindWriter(
    value: WriterLease | undefined,
    threadId: string,
): boolean {
    if (!value) return !Zotero.AsterMargin?.presence;
    const bound = Zotero.AsterMargin.presence.bind(value.claim, threadId);
    if (!bound) return false;
    value.claim = bound;
    return true;
}
export function releaseWriter(value = lease): void {
    if (!value || value !== lease) return;
    lease = undefined; // Revoke callbacks before notifying viewers.
    Zotero.AsterMargin.presence.release(value.claim);
    Zotero.AsterMargin.threads.invalidateViews();
}
export function assertWriter(value: WriterLease | undefined): void {
    if (!ownsWriter(value))
        throw Object.assign(new Error("Chat operation is no longer current"), {
            code: "thread_operation_canceled",
        });
}
