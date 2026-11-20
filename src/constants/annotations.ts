import { getPref } from '../utils/prefs';

export const ASTERMARGIN_ANNOTATION_AUTHOR = 'AsterMargin';
export const ASTERMARGIN_CITATION_ANNOTATION_AUTHOR = 'AsterMargin Citation';
export const ASTERMARGIN_VISUALIZER_ANNOTATION_AUTHOR = 'AsterMargin Visualizer';

export const DEFAULT_ASTERMARGIN_ANNOTATION_COLOR = '#ffd400';

export const ZOTERO_ANNOTATION_PALETTE_COLORS: Record<string, string> = {
    yellow: '#ffd400',
    red: '#ff6666',
    green: '#5fb236',
    blue: '#2ea8e5',
    purple: '#a28ae5',
    magenta: '#e56eee',
    orange: '#f19837',
    gray: '#aaaaaa',
};

export const ANNOTATION_TYPE_DB_IDS: Record<string, number> = {
    highlight: 1,
    note: 2,
    image: 3,
    ink: 4,
    underline: 5,
    text: 6,
};

/**
 * Maps annotation color names to hex values. The eight standard names map to
 * Zotero's native annotation palette (the same values used by Zotero's reader
 * and color filter) so AsterMargin-created highlights and notes are visually and
 * functionally identical to user-created ones — e.g. selecting "blue" in the
 * reader and asking AsterMargin for a "blue" highlight produce the same color, and
 * both show up under the same swatch in the annotation color filter.
 *
 * The backend only ever emits these eight names; the remaining entries are
 * tolerated fallbacks for names without a Zotero palette equivalent.
 */
export const ASTERMARGIN_ANNOTATION_COLORS: Record<string, string> = {
    ...ZOTERO_ANNOTATION_PALETTE_COLORS,
    // Non-palette names retained for forward compatibility; not emitted by the backend.
    pink: '#ff66c4',
    brown: '#e6a86e',
    cyan: '#7fdbff',
    lime: '#b4ff69',
    mint: '#b2f7d3',
    coral: '#ff9999',
    navy: '#6495ed',
    olive: '#e6e68a',
    teal: '#7fffd4',
};

/**
 * Resolve a AsterMargin annotation color name to its hex value, falling back to the
 * default highlight color for missing or unknown names.
 */
export function resolveAsterMarginAnnotationColor(color?: string | null): string {
    if (!color) return DEFAULT_ASTERMARGIN_ANNOTATION_COLOR;
    return ASTERMARGIN_ANNOTATION_COLORS[color] ?? DEFAULT_ASTERMARGIN_ANNOTATION_COLOR;
}

const ASTERMARGIN_ANNOTATION_AUTHORS = new Set([
    ASTERMARGIN_ANNOTATION_AUTHOR,
    ASTERMARGIN_CITATION_ANNOTATION_AUTHOR,
    ASTERMARGIN_VISUALIZER_ANNOTATION_AUTHOR,
]);

/**
 * Author name stored on annotations AsterMargin creates. Empty string means no
 * attribution. Not a reliable authorship signal — see astermarginAnnotationRegistry.
 */
export function getAsterMarginAnnotationAuthorName(): string {
    const configured = getPref('annotationAuthorName');
    return typeof configured === 'string' ? configured.trim() : ASTERMARGIN_ANNOTATION_AUTHOR;
}

/**
 * Whether an annotation's author marks it as AsterMargin's (agent, citation
 * preview, visualizer, etc.).
 *
 * Matches the built-in names (kept on older annotations) plus the configured
 * name, unless that name is empty or the user's own Zotero display name — then
 * matching it would misclassify the user's annotations.
 */
export function isAsterMarginAuthoredAnnotation(authorName: string | undefined | null): boolean {
    if (!authorName) return false;
    if (ASTERMARGIN_ANNOTATION_AUTHORS.has(authorName)) return true;
    const configured = getAsterMarginAnnotationAuthorName();
    if (!configured || configured !== authorName) return false;
    return configured !== (Zotero.Users.getCurrentName() || '');
}
