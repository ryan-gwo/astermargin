/* eslint-disable no-undef, no-restricted-globals */
/**
 * Script for the AsterMargin pane in Zotero's Preferences window.
 *
 * Registered via the `scripts` option of `Zotero.PreferencePanes.register()`
 * (see `src/hooks.ts`), which loads it into a sandbox scoped to the
 * preferences window before the pane markup is inserted.
 *
 * The handler lives here rather than in an `oncommand` attribute on the button
 * because Firefox 153 (Zotero 11) applies a baseline `script-src` CSP to every
 * chrome: document, which blocks inline event handlers. Zotero disables that
 * CSP for now but intends to remove the override.
 *
 * Because the script runs *before* the pane fragment is inserted, the button
 * does not exist yet — so this listens for the `command` event as it bubbles
 * up to the document instead of binding to the element directly.
 */
document.l10n.addResourceIds(["astermargin-addon.ftl"]);

const { Zotero: prefsZotero } = ChromeUtils.importESModule("chrome://zotero/content/zotero.mjs");

document.addEventListener("command", async (event) => {
    const target = event.target;
    if (!target || target.id !== "astermargin-open-prefs-btn") {
        return;
    }

    try {
        await prefsZotero.AsterMargin.hooks.onOpenPreferences();
    } catch (error) {
        prefsZotero.logError(error);
        const title = await document.l10n.formatValue("astermargin-preferences-pane-label");
        const message = await document.l10n.formatValue("astermargin-preferences-pane-open-failed");
        prefsZotero.alert(window, title, message);
    }
});
