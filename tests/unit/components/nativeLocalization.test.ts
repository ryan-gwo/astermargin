// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { initLocale, localizePluginElement } from "../../../src/utils/locale";

afterEach(() => vi.unstubAllGlobals());

it("formats only plugin controls with Fluent in the plugin's selected language", () => {
    const lookup = vi.fn(() => [
        {
            value: null,
            attributes: [{ name: "label", value: "開啟星箋設定" }],
        },
    ]);
    const localizer = vi.fn(function () {
        return { formatMessagesSync: lookup };
    });
    vi.stubGlobal("Localization", localizer);
    vi.stubGlobal("addon", { data: {} });
    vi.stubGlobal("Zotero", {
        locale: "en-US",
        AsterMargin: { interfaceLocale: "zh-TW" },
    });

    initLocale();
    expect(localizer).toHaveBeenCalledWith(
        ["astermargin-addon.ftl", "astermargin-mainWindow.ftl"],
        true,
        undefined,
        ["zh-TW", "en-US"],
    );
    const button = document.createElement("button");
    button.setAttribute("data-l10n-id", "astermargin-preferences-pane-open");
    localizePluginElement(button);
    expect(lookup).toHaveBeenCalledWith([
        { id: "astermargin-preferences-pane-open", args: undefined },
    ]);
    expect(button.getAttribute("label")).toBe("開啟星箋設定");
    expect(button.hasAttribute("data-l10n-id")).toBe(false);

    const hostElement = document.createElement("button");
    hostElement.setAttribute("data-l10n-id", "menu-file");
    localizePluginElement(hostElement);
    expect(hostElement.getAttribute("data-l10n-id")).toBe("menu-file");
    expect(lookup).toHaveBeenCalledOnce();
});
