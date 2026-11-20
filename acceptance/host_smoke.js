const {setTimeout: delay} = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
const sleep = ms => new Promise(resolve => delay(resolve, ms));
let live = true;
function startup() { void probe(); }
function install() {}
function uninstall() {}
function shutdown() { live = false; }

async function probe() {
    let result;
    try {
        await Zotero.initializationPromise;
        if (Zotero.DataDirectory.dir !== __DATA__) throw Error("Refusing to use a different data directory");
        for (let i = 0; i < 600 && Zotero.AsterMargin?.runtime?.resolveWindow()?.status !== "ready"; i++) await sleep(200);
        const addon = Zotero.AsterMargin;
        const win = Zotero.getMainWindow();
        win.document.getElementById("zotero-astermargin-tb-chat-toggle").doCommand();
        await sleep(500);
        const sidebar = win.document.getElementById("astermargin-react-root-sidebar")?.innerText;
        const item = new Zotero.Item("journalArticle");
        item.setField("title", __MARKER__);
        await item.saveTx();
        const quick = await addon.runtime.dispatchWindowCommand("/astermargin/test/quick-prompt", {toggle:true});
        const opened = await addon.runtime.dispatchWindowCommand("/astermargin/test/astermargin-window", {open:true});
        result = {host:Zotero.version, plugin:addon.pluginVersion, platform:Zotero.platform,
            ready:addon.runtime.resolveWindow()?.status === "ready", sidebar:!!sidebar?.trim(),
            quick:quick.state?.mode, window:opened.surfaces?.window_open, itemKey:item.key};
    } catch (error) {
        result = {error:String(error), stack:error.stack};
    }
    await IOUtils.writeUTF8(__RESULT__, JSON.stringify(result), {tmpPath:__RESULT__ + ".tmp"});
    while (live && !await IOUtils.exists(__STOP__)) await sleep(200);
    if (live && Zotero.DataDirectory.dir === __DATA__) Services.startup.quit(Services.startup.eAttemptQuit);
}
