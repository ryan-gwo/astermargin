import {
    categoryLabel,
    findTargetPreset,
    TARGET_TYPE_LABELS,
    type Action,
    type ActionCategory,
    type ActionTargetType,
} from "@astermargin/agent-core/types/actions";
import { ALL_BUILTIN_ACTIONS } from "../types/builtinActions";
import { knownSettingsText, settingsText } from "./settingsText";

const builtins = new Map(
    ALL_BUILTIN_ACTIONS.map((action) => [action.id, action]),
);

export function actionDisplayText(action: Action, field: "title"): string;
export function actionDisplayText(
    action: Action,
    field: "description",
): string | undefined;
export function actionDisplayText(
    action: Action,
    field: "title" | "description",
) {
    const value = action[field];
    const original = builtins.get(action.id)?.[field];
    return value && value === original ? knownSettingsText(value) : value;
}

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
