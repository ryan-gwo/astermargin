import { getPref } from "../../../src/utils/prefs";
import { setPref } from "../../../src/utils/prefs";
import { logger } from "@astermargin/agent-core/platform/logger";

// --- Save Preferences ---
export const handlePrefSave = (key: "googleGenerativeAiApiKey" | "openAiApiKey" | "anthropicApiKey" | "customInstructions" | "openAlexApiKey" | "semanticScholarApiKey" | "nasaAdsApiKey", value: string) => {
    if (value !== getPref(key)) {
        setPref(key, value);
        logger(`Saved pref ${key}`);
    }
};
