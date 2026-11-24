import { afterEach, describe, expect, it, vi } from "vitest";
import { interfaceLocale, uiText } from "../../../react/utils/interfaceText";
import {
    normalizeInterfaceLanguage,
    resolveInterfaceLocale,
} from "../../../src/utils/interfaceLanguage";
import { settingsText } from "../../../react/utils/settingsText";
import { actionDisplayText } from "../../../react/utils/actionDisplayText";
import { ALL_BUILTIN_ACTIONS } from "../../../react/types/builtinActions";
import { localRoundCapDescription } from "../../../react/components/preferences/localModeSettings";
import { DEFAULT_MAX_ROUNDS } from "@astermargin/agent-local/config/localAgentConfig";

afterEach(() => vi.unstubAllGlobals());

describe("settings localization", () => {
    it("prefers the plugin's language while retaining the host's locale", () => {
        vi.stubGlobal("Zotero", {
            locale: "en-US",
            AsterMargin: { interfaceLocale: "zh-TW" },
        });
        expect(interfaceLocale()).toBe("zh-TW");
        expect(settingsText("Interface language")).toBe("介面語言");
        expect(uiText("Search chats")).toBe("搜尋對話");
        expect(uiText("Current File")).toBe("目前檔案");
        expect(uiText("Filter by Collections")).toBe("依分類篩選");
        expect(uiText("Unreadable File")).toBe("無法讀取檔案");
        expect(uiText("Edit column")).toBe("編輯欄");
        expect(uiText("Fill {count} rows", { count: 3 })).toBe("填寫 3 列");
        expect(Zotero.locale).toBe("en-US");
    });

    it("falls back to Zotero for invalid or missing saved values", () => {
        expect(
            resolveInterfaceLocale(
                normalizeInterfaceLanguage(undefined),
                "zh-TW",
            ),
        ).toBe("zh-TW");
        expect(
            resolveInterfaceLocale(
                normalizeInterfaceLanguage("bad-value"),
                "zh-CN",
            ),
        ).toBe("zh-CN");
        expect(
            resolveInterfaceLocale(normalizeInterfaceLanguage("en"), "zh-CN"),
        ).toBe("en");
    });

    it.each([
        ["en-US", "en"],
        ["de-DE", "en"],
        ["zh-CN", "zh-CN"],
        ["zh-Hans", "zh-CN"],
        ["zh-TW", "zh-TW"],
        ["zh-Hant-HK", "zh-TW"],
    ])("uses the settings catalogue for %s", (locale, expected) => {
        vi.stubGlobal("Zotero", { locale });
        expect(interfaceLocale()).toBe(expected);
    });

    it("localizes values and surrounding text together", () => {
        vi.stubGlobal("Zotero", { locale: "zh-TW" });
        expect(
            settingsText("Citation Format: {format}", {
                format: settingsText("Numeric"),
            }),
        ).toBe("引文格式：數字編號");
        expect(localRoundCapDescription()).toContain(
            `預設值（${DEFAULT_MAX_ROUNDS}）`,
        );
    });

    it.each(["zh-CN", "zh-TW"])(
        "has localized display copy for built-in actions in %s",
        (locale) => {
            vi.stubGlobal("Zotero", { locale });
            for (const action of ALL_BUILTIN_ACTIONS) {
                expect(actionDisplayText(action, "title")).toMatch(
                    /\p{Script=Han}/u,
                );
                if (action.description)
                    expect(actionDisplayText(action, "description")).toMatch(
                        /\p{Script=Han}/u,
                    );
            }
            const builtin = ALL_BUILTIN_ACTIONS[0];
            expect(
                actionDisplayText(
                    { ...builtin, title: "Personal title" },
                    "title",
                ),
            ).toBe("Personal title");
            expect(
                actionDisplayText({ ...builtin, id: "custom-id" }, "title"),
            ).toBe(builtin.title);
        },
    );
});
