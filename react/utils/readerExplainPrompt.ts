import { getPref } from "../../src/utils/prefs";
import { settingsText } from "./settingsText";

// Treat the legacy English default as a default on profiles created before localization.
const defaultPrompt =
    "Explain the selected passage or annotation(s) from this paper in plain language. Provide context for any technical terms, statistical methods, or domain-specific concepts. If it references other work, briefly explain that context too.";

export function readerExplainPromptText(): string {
    const saved = getPref("readerExplainPrompt");
    return saved && saved !== defaultPrompt
        ? saved
        : settingsText(defaultPrompt);
}
