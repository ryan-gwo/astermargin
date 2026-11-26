const {setTimeout: delay} = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
const sleep = ms => new Promise(resolve => delay(resolve, ms));
let live = true;
function startup() { void probe(); }
function install() {}
function uninstall() {}
function shutdown() { live = false; }

async function readyAddon(previous) {
    for (let i = 0; i < 600; i++) {
        const addon = Zotero.AsterMargin;
        if (addon !== previous && addon?.runtime?.resolveWindow()?.status === "ready") return addon;
        await sleep(200);
    }
    throw Error("AsterMargin did not initialize");
}

// Invoke the real periodic updater, including its normal auto-install policy.
async function nativeBackgroundUpdate(manager, scenario, addon) {
    const { AddonManagerPrivate } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
    const id = "astermargin@astermargin.local";
    const installedBefore = await manager.getAddonByID(id);
    if (!manager.shouldAutoUpdate(installedBefore)) throw Error("Automatic plugin updates are disabled");
    let outcome;
    const capture = (name) => (install) => {
        if (install.existingAddon?.id === id) outcome = { name, error: install.error };
    };
    const listener = {
        onInstallEnded: capture("installed"),
        onDownloadFailed: capture("download-failed"),
        onInstallFailed: capture("install-failed"),
    };
    manager.addInstallListener(listener);
    try {
        await AddonManagerPrivate.backgroundUpdateCheck();
        if (scenario !== "compatibility") {
            for (let i = 0; i < 300 && !outcome; i++) await sleep(200);
        }
        const after = await manager.getAddonByID(id);
        if (scenario === "hash") {
            if (outcome?.name !== "download-failed" || outcome.error !== manager.ERROR_INCORRECT_HASH) {
                throw Error("Expected a native hash rejection, got " + JSON.stringify(outcome));
            }
        } else if (scenario === "compatibility") {
            if (outcome || (await manager.getAllInstalls()).some(install => install.existingAddon?.id === id)) {
                throw Error("Zotero attempted to install an incompatible update");
            }
        } else if (outcome?.name !== "installed" || after.version === installedBefore.version) {
            throw Error("Background update did not install: " + JSON.stringify(outcome));
        }
        if (scenario !== "install" && (after.version !== installedBefore.version || Zotero.AsterMargin !== addon)) {
            throw Error("The running plugin changed after an invalid update");
        }
        return { scenario, outcome: outcome?.name ?? "no-eligible-update", version: after.version };
    } finally {
        manager.removeInstallListener(listener);
    }
}

async function probe() {
    let result;
    try {
        await Zotero.initializationPromise;
        if (Zotero.DataDirectory.dir !== __DATA__) throw Error("Refusing to use a different data directory");
        let addon = await readyAddon();
        let upgradedFrom;
        let backgroundUpdate;
        let researchData;
        if (__UPGRADE_XPI__ || __BACKGROUND_UPDATE__) {
            upgradedFrom = addon.pluginVersion;
            const seed = __SEED_RESEARCH__ ? await seedResearchData(addon) : null;
            const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
            const spacing = "extensions.zotero.astermargin.chatLineSpacing";
            const language = "extensions.zotero.astermargin.interfaceLanguage";
            Zotero.Prefs.set(spacing, "spacious", true);
            const previousLanguage = Zotero.Prefs.get(language, true);
            if (__UPGRADE_XPI__) {
                const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
                const install = await AddonManager.getInstallForFile(new FileUtils.File(__UPGRADE_XPI__));
                await install.install();
                addon = await readyAddon(addon);
            } else {
                backgroundUpdate = await nativeBackgroundUpdate(AddonManager, __BACKGROUND_UPDATE__, addon);
                if (__BACKGROUND_UPDATE__ === "install") addon = await readyAddon(addon);
            }
            if (seed) researchData = await verifyResearchData(addon, seed);
            if (Zotero.Prefs.get(spacing, true) !== "spacious" ||
                Zotero.Prefs.get(language, true) !== previousLanguage) {
                throw Error("Update lost an existing preference");
            }
        }
        const win = Zotero.getMainWindow();
        win.document.getElementById("zotero-astermargin-tb-chat-toggle").doCommand();
        await sleep(500);
        if (__ZOTERO_LOCALE__ && !await IOUtils.exists(__LOCALE_SAVED__)) {
            await chooseSettingsLanguage(__ZOTERO_LOCALE__, __SETTINGS_LOCALE__);
            await IOUtils.writeUTF8(__LOCALE_SAVED__, __SETTINGS_LOCALE__);
            Services.startup.quit(Services.startup.eAttemptQuit);
            return;
        }
        const sidebar = win.document.getElementById("astermargin-react-root-sidebar")?.innerText;
        const item = new Zotero.Item("journalArticle");
        item.setField("title", __MARKER__);
        item.setField("abstractNote", "An abstract used when this fixture has no readable attachment.");
        await item.saveTx();
        const settings = __SETTINGS_LOCALE__ ? await inspectSettings(__SETTINGS_LOCALE__, __ZOTERO_LOCALE__ || __SETTINGS_LOCALE__) : null;
        if (addon !== Zotero.AsterMargin) {
            addon = Zotero.AsterMargin;
            win.document.getElementById("zotero-astermargin-tb-chat-toggle").doCommand();
            await sleep(500);
        }
        const tables = __TEST_TABLES__ ? await inspectResearchTable(item) : null;
        const home = settings ? await inspectHome(__SETTINGS_LOCALE__, item) : null;
        const quick = await addon.runtime.dispatchWindowCommand("/astermargin/test/quick-prompt", {toggle:true});
        const opened = await addon.runtime.dispatchWindowCommand("/astermargin/test/astermargin-window", {open:true});
        result = {host:Zotero.version, plugin:addon.pluginVersion, platform:Zotero.platform,
            ready:addon.runtime.resolveWindow()?.status === "ready", sidebar:!!sidebar?.trim(),
            quick:quick.state?.mode, window:opened.surfaces?.window_open, itemKey:item.key};
        if (settings) result.settings = settings;
        if (settings && Services.vc.compare(addon.pluginVersion, "0.1.8") >= 0)
            result.menus = await inspectWindowMenus(__SETTINGS_LOCALE__);
        if (home) result.home = home;
        if (upgradedFrom) result.upgradedFrom = upgradedFrom;
        if (backgroundUpdate) result.backgroundUpdate = backgroundUpdate;
        if (researchData) result.researchData = researchData;
        if (tables) result.tables = tables;
    } catch (error) {
        result = {error:String(error), stack:error.stack};
    }
    await IOUtils.writeUTF8(__RESULT__, JSON.stringify(result), {tmpPath:__RESULT__ + ".tmp"});
    if (result.error && __ZOTERO_LOCALE__ && !await IOUtils.exists(__LOCALE_SAVED__)) {
        Services.startup.quit(Services.startup.eAttemptQuit);
        return;
    }
    while (live && !await IOUtils.exists(__STOP__)) await sleep(200);
    if (live && Zotero.DataDirectory.dir === __DATA__) Services.startup.quit(Services.startup.eAttemptQuit);
}
