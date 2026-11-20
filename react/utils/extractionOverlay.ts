/**
 * Re-export shim for the shared overlay builders.
 *
 * The implementation moved to `src/astermargin-extract/debug/overlayBuilders.ts`
 * so the CLI can import the same builders without dragging in
 * `MuPDFWorkerClient` (which the `src/astermargin-extract/index.ts` barrel
 * re-exports). This file stays in place only for back-compat with the
 * React-side consumers (`extractionVisualizer.ts`, the
 * `pdf-render-overlay` HTTP handler).
 */
export {
    OVERLAY_COLORS,
    buildColumnOverlayFromPage,
    buildColumnOverlayFromDebugPage,
    buildItemOverlayFromPage,
    buildItemOverlayFromDebugPage,
    buildLineOverlayFromPage,
    buildLineOverlayFromDebugPage,
    buildMarginsOverlayFromAnalysis,
    buildSentenceOverlayFromPage,
    buildSentenceOverlayFromDebugPage,
    buildSentenceOverlayFromResult,
} from "../../src/astermargin-extract/debug/overlayBuilders";

export type {
    OverlayLevel,
    OverlayRect,
    OverlayResult,
} from "../../src/astermargin-extract/debug/overlayBuilders";
