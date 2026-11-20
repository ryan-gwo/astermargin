import type { PassageEvidence } from '@astermargin/agent-local/run/localCitations';
/**
 * Page-window attachment reader for the in-plugin agent (`read_attachment`).
 *
 * Reads the document through `handleZoteroDocumentRequest` in object mode, so
 * extraction runs on this computer (MuPDF worker, EPUB/snapshot parsers, the
 * local document cache) and the extracted document is never serialized for a
 * remote consumer. The result is a bounded window of pages: at most the
 * requested range, and at most `max_chars` characters of page text.
 *
 * Reachable from the webpack bundle, so plugin state is read through
 * `Zotero.AsterMargin`, never the bare `addon` global.
 */

import type { AgentDataRequestEntry } from '@astermargin/agent-core/transport/agentDataDispatch';
import type { ItemStub, ZoteroItemReference } from '@astermargin/agent-core/types/zotero';
import { handleZoteroDocumentRequest } from './handleZoteroDocumentRequest';
import { checkLibraryExcluded } from './utils';
import { documentToReadPages } from '../documentExtraction/attachmentReadPages';
import {
    libraryRefForLibraryID,
    modelObjectIdFromReference,
    resolveObjectId,
    UNRESOLVED_LIBRARY_ID,
} from '../../utils/libraryIdentity';

export interface ReadAttachmentRequest {
    event: 'read_attachment_request';
    request_id: string;
    /** Model-facing attachment (or parent item) id, e.g. "u-ABC12345". */
    attachment_id: string;
    /** First page to return, 1-indexed. */
    start_page: number;
    /** Last page to return, inclusive. The caller caps the range. */
    end_page: number;
    /** Most characters of page text to return. */
    max_chars: number;
    located?: boolean;
}

export interface ReadAttachmentPage {
    page_number: number;
    text: string;
    /** The page alone exceeded the text budget and was cut at it. */
    truncated?: true;
}

export interface ReadAttachmentResponse {
    type: 'read_attachment';
    request_id: string;
    attachment_id?: string;
    /** The attachment actually read (a parent item id resolves to one of its files). */
    attachment?: ZoteroItemReference;
    content_kind?: string;
    parent_item?: ItemStub;
    total_pages?: number;
    start_page?: number;
    /** Last page returned. */
    end_page?: number;
    pages?: ReadAttachmentPage[];
    evidence?: PassageEvidence[];
    /** First page not returned, when the document continues past this window. */
    next_start_page?: number;
    error?: string;
    error_code?: string;
}

export async function handleReadAttachmentRequest(
    request: ReadAttachmentRequest,
    ocr?: (ref: ZoteroItemReference, pages: import('../documentExtraction/attachmentReadPages').AttachmentReadPage[]) => Promise<void>,
): Promise<ReadAttachmentResponse> {
    const { request_id, attachment_id, start_page: startPage, end_page: endPage, max_chars: maxChars } = request;
    const failure = (error: string, error_code: string): ReadAttachmentResponse => ({
        type: 'read_attachment',
        request_id,
        error,
        error_code,
    });

    const ref = resolveObjectId(attachment_id);
    if (!ref) {
        return failure(
            `Invalid attachment_id "${attachment_id}". Expected <library>-<zotero_key>, e.g. "u-ABC12345".`,
            'invalid_format',
        );
    }
    if (ref.library_id === UNRESOLVED_LIBRARY_ID) {
        return failure(`The library for attachment "${attachment_id}" is not available on this computer.`, 'library_unavailable');
    }
    // The document handler enforces this as well; checking here keeps the
    // boundary independent of how that handler resolves the reference.
    const excluded = checkLibraryExcluded(ref.library_id);
    if (excluded) return failure(excluded.message, 'library_excluded');

    const response = await handleZoteroDocumentRequest({
        event: 'zotero_document_request',
        request_id,
        attachment: {
            library_id: ref.library_id,
            zotero_key: ref.zotero_key,
            library_ref: ref.library_ref ?? libraryRefForLibraryID(ref.library_id) ?? undefined,
        },
        mode: request.located ? 'structured' : 'markdown',
    });
    const scan = !!request.located && !!ocr && response.error_code === 'no_text_layer';
    if ((response.error || !response.result) && !scan) {
        return failure(response.error ?? 'Failed to read attachment.', response.error_code ?? 'extraction_failed');
    }
    let document = response.result ? documentToReadPages(response.result, !!request.located) ?? documentToReadPages(response.result, false) : null;
    if (scan) {
        const count = response.total_pages ?? endPage;
        const last = Math.min(endPage,count);
        const candidates = Array.from({length:Math.max(0,last-startPage+1)},(_,i)=>({pageNumber:startPage+i}));
        document={pageCount:count,pages:candidates};
    }
    if (!document) return failure('Attachment has no addressable content.', 'unsupported_type');

    const totalPages = document.pageCount;
    if (Number.isInteger(totalPages) && startPage > totalPages) {
        return failure(
            `Requested start_page ${startPage} is out of range; the attachment has ${totalPages} pages.`,
            'invalid_page_range',
        );
    }
    const inRange = document.pages.filter((page) => page.pageNumber >= startPage && page.pageNumber <= endPage);
    if (inRange.length === 0) {
        return failure(`Pages ${startPage}-${endPage} contain no extractable text.`, 'invalid_page_range');
    }

    if (ocr && request.located && (response.result?.content_kind ?? response.content_kind ?? 'pdf') === 'pdf') {
        await ocr(response.resolved_attachment ?? ref, inRange.filter(p => !p.markdown?.trim() && !p.passages?.some(s => String(s.text ?? '').trim())));
    }
    if (scan && !inRange.some(p=>p.passages?.length)) return failure('Scanned attachment requires a local OCR language in Advanced settings.', 'ocr_required');
    const pages: ReadAttachmentPage[] = [];
    const evidence: PassageEvidence[] = [];
    let budget = maxChars;
    for (const page of inRange) {
        if (budget <= 0) break;
        let text = page.markdown ?? '';
        let incomplete = false;
        if (page.passages) {
            const lines: string[] = [];
            let length = 0;
            for (const part of page.passages) {
                if (typeof part.part_id !== 'string' || typeof part.text !== 'string' || !part.text.trim()) continue;
                const prefix = '[' + part.part_id + '] ';
                const room = budget - length - prefix.length - 1;
                if (room < 1) { incomplete = true; break; }
                const quote = part.text.slice(0, room);
                if (quote.length < part.text.length) incomplete = true;
                lines.push(prefix + quote);
                length += prefix.length + quote.length + 1;
                const pdf = (part.page_locations as Array<{page_idx:number; boxes:Array<{l:number;t:number;r:number;b:number}>}> | undefined)?.[0];
                evidence.push({id:part.part_id,page:page.pageNumber,text:quote,
                    location:{part_id:part.part_id, text:quote,
                        ...(pdf ? {page_idx:pdf.page_idx,boxes:pdf.boxes.map(b=>[b.l,b.t,b.r,b.b])} : {}),
                        ...(typeof part.section_href === 'string' ? {section_href:part.section_href}:{}),
                        ...(typeof part.anchor_id === 'string' ? {anchor_id:part.anchor_id}:{}),
                        ...(typeof part.line === 'number' ? {line:part.line}:{})}});
            }
            text=lines.join('\n');
        }
        if (text.length <= budget) {
            pages.push({ page_number: page.pageNumber, text, ...(incomplete ? {truncated:true as const} : {}) });
            budget -= text.length;
            continue;
        }
        // Always return something: a first page larger than the whole budget
        // is cut rather than skipped, so progressive reading cannot stall.
        if (pages.length === 0) {
            pages.push({ page_number: page.pageNumber, text: text.slice(0, budget), truncated: true });
        }
        break;
    }

    if (!pages.length) return failure('No readable content in this range.', 'empty_document');
    const lastReturned = pages[pages.length - 1].page_number;
    const lastPage = Number.isInteger(totalPages) ? totalPages : document.pages[document.pages.length - 1].pageNumber;
    const attachment = response.resolved_attachment ?? {
        library_id: ref.library_id,
        zotero_key: ref.zotero_key,
        ...(ref.library_ref ? { library_ref: ref.library_ref } : {}),
    };

    return {
        type: 'read_attachment',
        request_id,
        attachment_id: modelObjectIdFromReference(attachment),
        attachment,
        content_kind: response.result?.content_kind ?? response.content_kind ?? 'pdf',
        ...(response.parent_item ? { parent_item: response.parent_item } : {}),
        total_pages: totalPages,
        start_page: startPage,
        end_page: lastReturned,
        pages,
        ...(evidence.length ? {evidence} : {}),
        ...(lastReturned < lastPage ? { next_start_page: lastReturned + 1 } : {}),
    };
}

/** Data-provider entry for `read_attachment_request`, registered by the local agent. */
export const readAttachmentEntry: AgentDataRequestEntry & {
    errorResponse: (event: ReadAttachmentRequest, err: unknown) => ReadAttachmentResponse;
} = {
    handle: (event: ReadAttachmentRequest) => handleReadAttachmentRequest(event) as Promise<Record<string, any>>,
    errorResponse: (event: ReadAttachmentRequest, err: unknown) => ({
        type: 'read_attachment',
        request_id: event.request_id,
        error: String(err),
        error_code: 'extraction_failed',
    }),
};
