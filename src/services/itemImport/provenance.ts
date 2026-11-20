/**
 * AsterMargin provenance stamp in an item's Extra field (`Added by AsterMargin: <date>`).
 *
 * Esbuild-safe: no `react/*` imports, no bare `addon`.
 */

export const ASTERMARGIN_PROVENANCE_MARKER = 'Added by AsterMargin';

/**
 * Stamp AsterMargin provenance into an item's Extra field without saving it.
 */
export function stampAsterMarginProvenanceExtra(
    item: Zotero.Item,
    options: { reason?: string } = {},
): boolean {
    const currentExtra = (item.getField('extra') as string) || '';
    if (currentExtra.includes(ASTERMARGIN_PROVENANCE_MARKER)) {
        return false;
    }

    const addedDate = new Date().toISOString().slice(0, 10);
    const extraLines = [`${ASTERMARGIN_PROVENANCE_MARKER}: ${addedDate}`];
    if (options.reason && !currentExtra.includes(`AsterMargin Reason: ${options.reason}`)) {
        extraLines.push(`AsterMargin Reason: ${options.reason}`);
    }

    item.setField('extra', currentExtra ? `${currentExtra}\n${extraLines.join('\n')}` : extraLines.join('\n'));
    return true;
}
