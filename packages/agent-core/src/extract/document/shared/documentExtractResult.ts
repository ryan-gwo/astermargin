import type { AsterMarginExtractResult } from '../../schema';
import type { EpubDocument } from '../epub/schema';
import type { SnapshotDocument } from '../snapshot/schema';
import type { ExtractContentKind } from './contentKinds';

export type PdfDocumentExtractResult = AsterMarginExtractResult & {
    content_kind: Extract<ExtractContentKind, 'pdf'>;
};

export interface TextDocumentLine {
    id: string;
    line: number;
    text: string;
}

export interface TextDocumentExtractResult {
    content_kind: Extract<ExtractContentKind, 'text'>;
    schemaVersion: string;
    createdAt?: string;
    mode: 'text';
    document: {
        lineCount: number;
        sourceContentType?: string;
        lines: TextDocumentLine[];
    };
}

export type DocumentExtractResult =
    | PdfDocumentExtractResult
    | EpubDocument
    | SnapshotDocument
    | TextDocumentExtractResult;
