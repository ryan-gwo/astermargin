export {
    extractSnapshotDocument,
    extractSnapshotDocumentFromFile,
    extractSnapshotDocumentSafe,
    preflightSnapshotFile,
    resolveSnapshotSectionMeta,
} from "./SnapshotExtractor";
export type {
    ExtractSnapshotDocumentOptions,
    ExtractSnapshotFromFileOptions,
    SnapshotPreflightResult,
} from "./SnapshotExtractor";
export {
    parseSnapshotHtml,
    prepareSnapshotDocument,
} from "./snapshotDom";
export type {
    ExtractSnapshotResult,
    SnapshotContentKind,
    SnapshotDocument,
} from "@astermargin/agent-core/extract/document/snapshot/schema";
export {
    SNAPSHOT_CONTENT_KIND,
    SNAPSHOT_SCHEMA_VERSION,
    validateSnapshotDocument,
} from "@astermargin/agent-core/extract/document/snapshot/schema";
