import type { AttachmentResolvedPayload } from '../../src/services/attachmentResolved';
import { emitAttachmentResolved } from '../utils/attachmentResolvedEvent';
import { tryGetWindowRuntime } from './windowRuntime';

/** Completion carries its own thread/action identity and may outlive the originating run. */
export function captureAttachmentCompletion(): (payload: AttachmentResolvedPayload) => void {
    const runtime = tryGetWindowRuntime();
    const generation = Zotero.AsterMargin.account?.getGeneration();
    return payload => {
        if (runtime?.status !== 'closing' && generation === Zotero.AsterMargin.account?.getGeneration()) {
            emitAttachmentResolved(payload);
        }
    };
}
