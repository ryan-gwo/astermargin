/** The plugin realm owns writes so edits in different Zotero windows are ordered. */
export class ProviderVault {
    private tail: Promise<void> = Promise.resolve();
    private readonly origin = "chrome://astermargin";
    private readonly realm = "AsterMargin provider settings";

    private login(name: string) {
        return Services.logins
            .findLogins(this.origin, null as any, this.realm)
            .find((login) => login.username === name);
    }

    read(name: string): string {
        return this.login(name)?.password ?? "";
    }

    write(name: string, value: string): Promise<void> {
        const persist = async () => {
            const login = this.login(name);
            const pref = "extensions.zotero.astermargin." + name;
            if (
                ((!value && !login) || login?.password === value) &&
                String(Zotero.Prefs.get(pref, true)).startsWith("vault:")
            )
                return;
            if (!value) {
                if (login) Services.logins.removeLogin(login);
            } else if (!login || login.password !== value) {
                const replacement = (Components.classes as any)[
                    "@mozilla.org/login-manager/loginInfo;1"
                ].createInstance(Components.interfaces.nsILoginInfo);
                replacement.init(
                    this.origin,
                    null as any,
                    this.realm,
                    name,
                    value,
                    "",
                    "",
                );
                if (login) Services.logins.modifyLogin(login, replacement);
                else await Services.logins.addLoginAsync(replacement);
            }
            // The preference is only a change notification for the window stores.
            const rev =
                Number(String(Zotero.Prefs.get(pref, true)).split(":")[1]) || 0;
            Zotero.Prefs.set(pref, "vault:" + (rev + 1), true);
        };
        const result = this.tail.then(persist);
        this.tail = result.catch(() => {});
        return result;
    }
}

const secretPrefs = new Set([
    "customChatModels",
    "lastUsedModel",
    "openAiApiKey",
    "anthropicApiKey",
    "googleGenerativeAiApiKey",
    "openAlexApiKey",
    "semanticScholarApiKey",
    "nasaAdsApiKey",
    "cloudOcrApiKey",
    "webdavPassword",
]);
export function isSecretPref(name: string): boolean {
    return secretPrefs.has(name);
}
