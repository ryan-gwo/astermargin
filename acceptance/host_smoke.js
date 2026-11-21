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

async function probe() {
    let result;
    try {
        await Zotero.initializationPromise;
        if (Zotero.DataDirectory.dir !== __DATA__) throw Error("Refusing to use a different data directory");
        let addon = await readyAddon();
        let upgradedFrom;
        if (__UPGRADE_XPI__) {
            upgradedFrom = addon.pluginVersion;
            const { AddonManager } = ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");
            const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
            Zotero.Prefs.set("extensions.zotero.astermargin.chatLineSpacing", "spacious", true);
            const install = await AddonManager.getInstallForFile(new FileUtils.File(__UPGRADE_XPI__));
            await install.install();
            addon = await readyAddon(addon);
            if (Zotero.Prefs.get("extensions.zotero.astermargin.chatLineSpacing", true) !== "spacious") {
                throw Error("Upgrade lost the existing line spacing preference");
            }
        }
        const win = Zotero.getMainWindow();
        win.document.getElementById("zotero-astermargin-tb-chat-toggle").doCommand();
        await sleep(500);
        const sidebar = win.document.getElementById("astermargin-react-root-sidebar")?.innerText;
        const item = new Zotero.Item("journalArticle");
        item.setField("title", __MARKER__);
        await item.saveTx();
        const settings = __SETTINGS_LOCALE__ ? await inspectSettings(__SETTINGS_LOCALE__) : null;
        const quick = await addon.runtime.dispatchWindowCommand("/astermargin/test/quick-prompt", {toggle:true});
        const opened = await addon.runtime.dispatchWindowCommand("/astermargin/test/astermargin-window", {open:true});
        result = {host:Zotero.version, plugin:addon.pluginVersion, platform:Zotero.platform,
            ready:addon.runtime.resolveWindow()?.status === "ready", sidebar:!!sidebar?.trim(),
            quick:quick.state?.mode, window:opened.surfaces?.window_open, itemKey:item.key};
        if (settings) result.settings = settings;
        if (upgradedFrom) result.upgradedFrom = upgradedFrom;
    } catch (error) {
        result = {error:String(error), stack:error.stack};
    }
    await IOUtils.writeUTF8(__RESULT__, JSON.stringify(result), {tmpPath:__RESULT__ + ".tmp"});
    while (live && !await IOUtils.exists(__STOP__)) await sleep(200);
    if (live && Zotero.DataDirectory.dir === __DATA__) Services.startup.quit(Services.startup.eAttemptQuit);
}
