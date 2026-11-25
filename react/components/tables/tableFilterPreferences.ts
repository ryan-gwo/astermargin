import type { Filter } from "@astermargin/agent-core/layouts/table";
import type { TableRef } from "../../../src/services/artifacts/tableItemIdentity";
import { getPref, setPref } from "../../../src/utils/prefs";

function readPreferences(): Record<string, unknown> {
    try {
        const value = JSON.parse(getPref("researchTableFilters") || "{}");
        if (value && typeof value === "object" && !Array.isArray(value))
            return value;
    } catch (error) {
        Zotero.logError(error as Error);
    }
    return {};
}

function isFilter(value: unknown): value is Filter {
    if (!value || typeof value !== "object") return false;
    const filter = value as Record<string, unknown>;
    if (typeof filter.column_id !== "string") return false;
    switch (filter.kind) {
        case "empty":
            return typeof filter.empty === "boolean";
        case "equals":
            return typeof filter.value === "boolean";
        case "in":
            return (
                Array.isArray(filter.labels) &&
                filter.labels.every((label) => typeof label === "string")
            );
        case "contains":
            return typeof filter.text === "string";
        default:
            return false;
    }
}

export function readTableFilters(ref: TableRef): Filter[] {
    const value = readPreferences()[`${ref.libraryID}/${ref.key}`];
    return Array.isArray(value) ? value.filter(isFilter) : [];
}

export function saveTableFilters(ref: TableRef, filters: Filter[]): void {
    const preferences = readPreferences();
    const key = `${ref.libraryID}/${ref.key}`;
    if (filters.length) preferences[key] = filters;
    else delete preferences[key];
    setPref("researchTableFilters", JSON.stringify(preferences));
}
