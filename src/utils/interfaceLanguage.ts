export const interfaceLanguages = ["auto", "en", "zh-CN", "zh-TW"] as const;
export type InterfaceLanguage = (typeof interfaceLanguages)[number];
export type InterfaceLocale = Exclude<InterfaceLanguage, "auto">;

export function normalizeInterfaceLanguage(value: unknown): InterfaceLanguage {
    return interfaceLanguages.find((language) => language === value) ?? "auto";
}

export function resolveInterfaceLocale(
    language: InterfaceLanguage,
    hostLocale: string,
): InterfaceLocale {
    if (language !== "auto") return language;
    if (!/^zh(?:[-_]|$)/i.test(hostLocale)) return "en";
    return /(?:^|[-_])(?:Hant|TW|HK|MO)(?:[-_]|$)/i.test(hostLocale)
        ? "zh-TW"
        : "zh-CN";
}

export function interfaceLocale(): InterfaceLocale {
    if (typeof Zotero === "undefined") return "en";
    return (
        Zotero.AsterMargin?.interfaceLocale ??
        resolveInterfaceLocale("auto", Zotero.locale)
    );
}

/** Native widgets already use Zotero's locale when both interfaces agree. */
export function interfaceLocaleOverridesHost(): boolean {
    return (
        interfaceLocale() !== resolveInterfaceLocale("auto", Zotero.locale) ||
        (interfaceLocale() !== "en" &&
            !["zh-CN", "zh-TW"].includes(Zotero.locale))
    );
}
