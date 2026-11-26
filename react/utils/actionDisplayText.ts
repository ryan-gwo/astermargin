import {
    categoryLabel,
    findTargetPreset,
    TARGET_TYPE_LABELS,
    type ActionCategory,
    type ActionTargetType,
} from "@astermargin/agent-core/types/actions";
import { knownSettingsText, settingsText } from "./settingsText";

export { actionDisplayText } from "../../src/utils/actionDisplayText";

export function actionCategoryText(
    category: ActionCategory | undefined,
): string {
    return knownSettingsText(categoryLabel(category));
}

export function actionTargetsText(targets: ActionTargetType[]): string {
    const preset = findTargetPreset(targets);
    if (preset) return knownSettingsText(preset.label);
    return targets
        .map((target) => knownSettingsText(TARGET_TYPE_LABELS[target]))
        .reduce((a, b) => (a ? settingsText("{a} or {b}", { a, b }) : b), "");
}
