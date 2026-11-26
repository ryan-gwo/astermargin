/* Exercise production settings in a disposable Zotero profile. */
async function inspectUpdates(win, locale, scenario, fixtureVersion) {
    const { AddonManager: manager, AddonManagerPrivate } =
        ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
    const id = "astermargin@astermargin.local";
    const current = await manager.getAddonByID(id);
    const initialVersion = current.version;
    const doc = win.document;
    const button = (name) => doc.getElementById("astermargin-" + name);
    const automatic = button("auto-updates");
    const check = button("check-updates");
    const install = () => button("install-update");
    const checked = (value) => automatic.getAttribute("aria-checked") === String(value) && !automatic.disabled;
    await waitFor(() => checked(true), "follow Zotero default on first display");
    if (current.applyBackgroundUpdates !== manager.AUTOUPDATE_DEFAULT) {
        throw Error("Opening settings changed the native update policy");
    }

    automatic.click();
    await waitFor(
        () => current.applyBackgroundUpdates === manager.AUTOUPDATE_DISABLE && checked(false),
        "native automatic updates disabled",
    );
    automatic.click();
    await waitFor(
        () => current.applyBackgroundUpdates === manager.AUTOUPDATE_ENABLE && checked(true),
        "native automatic updates enabled",
    );
    manager.autoUpdateDefault = false;
    button("restore-update-default").click();
    await waitFor(
        () => current.applyBackgroundUpdates === manager.AUTOUPDATE_DEFAULT && checked(false),
        "automatic updates follow Zotero default",
    );
    manager.autoUpdateDefault = true;
    await waitFor(() => checked(true), "settings reflect external native change");
    automatic.click();
    await waitFor(
        () => current.applyBackgroundUpdates === manager.AUTOUPDATE_DISABLE && checked(false),
        "manual check with automatic updates disabled",
    );

    const notes = {
        "en-US": "Fixture summary",
        "zh-CN": "隔离验收摘要",
        "zh-TW": "隔離驗收摘要",
    }[locale];
    const publishedAt = "2026-11-25T00:00:00Z";
    const actualRequest = Zotero.HTTP.request;
    Zotero.HTTP.request = function(method, url, ...rest) {
        if (method === "GET" && url === "https://api.github.com/repos/ryan-gwo/astermargin/releases/tags/v" + fixtureVersion) {
            if (scenario === "manual") return Promise.reject(Error("Fixture: release API rate limited"));
            return Promise.resolve({ responseText: JSON.stringify({
                tag_name: "v" + fixtureVersion, body: notes, published_at: publishedAt,
                draft: false, prerelease: false,
            }) });
        }
        if (method === "GET" && url === "https://github.com/ryan-gwo/astermargin/releases/tag/v" + fixtureVersion) {
            return Promise.resolve({
                responseText: `<relative-time datetime="${publishedAt}"></relative-time><div data-test-selector="body-content"><div><p>${notes}</p></div></div>`,
            });
        }
        return actualRequest.call(this, method, url, ...rest);
    };

    const copy = () => doc.getElementById("astermargin-preferences-panel").textContent;
    const expected = {
        current: {
            "en-US": "No compatible update is available.",
            "zh-CN": "没有可用的兼容更新。",
            "zh-TW": "目前沒有相容的更新。",
        },
        network: {
            "en-US": "Could not check for updates. Try again.",
            "zh-CN": "检查更新失败，请重试。",
            "zh-TW": "檢查更新失敗，請重試。",
        },
        hash: {
            "en-US": "The update file failed verification.",
            "zh-CN": "更新安装包校验失败",
            "zh-TW": "更新安裝套件驗證失敗",
        },
    };
    let installedVersion;
    try {
        if (scenario === "manual") {
            await AddonManagerPrivate.backgroundUpdateCheck();
            if ((await manager.getAddonByID(id)).version !== initialVersion) {
                throw Error("Native updater installed while automatic updates were off");
            }
        }

        check.click();
        if (["current", "network", "compatibility"].includes(scenario)) {
            const label = expected[scenario === "compatibility" ? "current" : scenario][locale];
            await waitFor(() => copy().includes(label), scenario + " message");
            if (install()) throw Error("Ineligible update showed an install button");
        } else {
            await waitFor(() => install() && copy().includes(notes) && copy().includes(fixtureVersion), "available update and summary");
            const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(publishedAt));
            requireCopy(copy(), [date], "version publication date");
            if ((await manager.getAddonByID(id)).version !== initialVersion) {
                throw Error("Checking for updates installed before the user's click");
            }
            const previous = Zotero.AsterMargin;
            install().click();
            if (scenario === "hash") {
                await waitFor(() => copy().includes(expected.hash[locale]), "native hash verification failure");
            } else {
                await readyAddon(previous);
            }
        }
        const installed = await manager.getAddonByID(id);
        installedVersion = installed.version;
        if (installedVersion !== (scenario === "manual" ? fixtureVersion : initialVersion)) {
            throw Error("Unexpected installed version: " + installedVersion);
        }
        if (installed.applyBackgroundUpdates !== manager.AUTOUPDATE_DISABLE) {
            throw Error("The selected automatic update mode was lost");
        }
        if (installed.pendingOperations & (manager.PENDING_UPGRADE | manager.PENDING_INSTALL)) {
            throw Error("Unexpected pending restart for this update");
        }
        const lastChecked = Zotero.Prefs.get("extensions.zotero.astermargin.lastUpdateCheck", true);
        if (!Number.isFinite(Date.parse(lastChecked))) throw Error("No last check time was saved");
        return { scenario, installedVersion, lastChecked, modes: ["default", "disabled", "enabled", "default"] };
    } finally {
        Zotero.HTTP.request = actualRequest;
    }
}
