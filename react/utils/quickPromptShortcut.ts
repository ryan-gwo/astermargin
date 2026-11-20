/**
 * AsterMargin's chords as the user should read them, with the key the user
 * configured for AsterMargin's shortcuts: the quick prompt is Cmd+Option+<key> on
 * macOS and Ctrl+Alt+<key> elsewhere; the AsterMargin window is Cmd+Shift+<key>
 * and Ctrl+Shift+<key>. The chords themselves are matched in
 * `src/utils/shortcuts.ts` and `src/ui/ui.ts`; these are their display forms,
 * shared by everything that names them.
 */
import { getPref } from '../../src/utils/prefs';

function shortcutKey(): string {
    return (getPref('keyboardShortcut') || 'j').toUpperCase();
}

/** The chord key by key, for drawing keycaps. */
export function quickPromptShortcutKeys(): string[] {
    const key = shortcutKey();
    return Zotero.isMac ? ['⌘', '⌥', key] : ['Ctrl', 'Alt', key];
}

/** The chord as one piece of text. */
export function quickPromptShortcutLabel(): string {
    const key = shortcutKey();
    return Zotero.isMac ? `⌘⌥${key}` : `Ctrl+Alt+${key}`;
}

/** The AsterMargin window chord key by key, for drawing keycaps. */
export function astermarginWindowShortcutKeys(): string[] {
    const key = shortcutKey();
    return Zotero.isMac ? ['⌘', '⇧', key] : ['Ctrl', 'Shift', key];
}

/** The AsterMargin window chord as one piece of text. */
export function astermarginWindowShortcutLabel(): string {
    const key = shortcutKey();
    return Zotero.isMac ? `⌘⇧${key}` : `Ctrl+Shift+${key}`;
}
