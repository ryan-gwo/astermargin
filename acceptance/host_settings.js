/* Loaded by host_smoke.py only for a locale check in its disposable profile. */
const settingsExpectations = {
    "en-US": {
        native: [
            "Open AsterMargin Settings",
            "Open the settings window for AsterMargin",
        ],
        title: "AsterMargin Settings",
        general: [
            "Keyboard Shortcut",
            "Changes require restart",
            "Chat Line Spacing",
            "Spacious",
            "Citation Format",
        ],
        sync: ["Libraries", "Background Processing", "Problems"],
        permissions: [
            "Library Modifications",
            "Metadata Edits",
            "Always ask",
            "System Notifications",
            "Access Remote Files",
        ],
        approval: [
            "Always apply",
            "Always review later",
            "Prompt for approval before making changes",
        ],
        models: [
            "Run entirely on this device",
            "Scholarly search",
            "Max searches per request",
            "Select Add Provider",
        ],
        addProvider: "Add Provider",
        provider: [
            "Provider name",
            "Endpoint URL",
            "Test streaming, tools and vision",
            "Supports vision",
            "Test Endpoint",
        ],
        invalidUrl: "Enter a valid URL",
        actions: [
            "Import",
            "Add Action",
            "Summarize",
            "Write a literature review",
        ],
        addAction: "Add Action",
        editor: [
            "Action title",
            "Slash command",
            "Prompt",
            "Applies to",
            "Save",
        ],
        advanced: [
            "Custom Instructions",
            "Local Document Cache",
            "Scanned PDF OCR",
            "Full-text semantic search",
            "Research sync",
            "Explain the selected passage or annotation(s)",
            "Enable MCP Server",
        ],
    },
    "zh-CN": {
        native: ["打开星笺设置", "打开星笺的独立设置窗口"],
        title: "星笺设置",
        general: ["键盘快捷键", "重启后生效", "对话行距", "宽松", "引文格式"],
        sync: ["文献库", "后台处理", "问题"],
        permissions: [
            "更改文献库",
            "编辑元数据",
            "每次询问",
            "系统通知",
            "访问远程文件",
        ],
        approval: ["直接应用", "稍后审阅", "更改前征求批准"],
        models: [
            "在本机运行",
            "学术检索",
            "单次请求的搜索次数上限",
            "选择“添加服务”",
        ],
        addProvider: "添加服务",
        provider: [
            "服务名称",
            "端点地址",
            "测试流式输出、工具调用和图像输入",
            "支持视觉",
            "测试端点",
        ],
        invalidUrl: "请输入有效的 URL",
        actions: ["导入", "添加动作", "概括文献", "撰写文献综述"],
        addAction: "添加动作",
        editor: ["动作标题", "斜杠命令", "提示词", "适用范围", "保存"],
        advanced: [
            "自定义指令",
            "本机文档缓存",
            "扫描件 OCR",
            "全文语义检索",
            "研究数据同步",
            "用通俗语言解释这篇论文中选中的段落或批注",
            "启用 MCP 服务器",
        ],
    },
    "zh-TW": {
        native: ["開啟星箋設定", "開啟星箋的獨立設定視窗"],
        title: "星箋設定",
        general: [
            "鍵盤快速鍵",
            "重新啟動後生效",
            "對話行距",
            "加寬",
            "引文格式",
        ],
        sync: ["文獻庫", "背景處理", "問題"],
        permissions: [
            "變更文獻庫",
            "編輯詮釋資料",
            "每次詢問",
            "系統通知",
            "存取遠端檔案",
        ],
        approval: ["直接套用", "稍後審閱", "變更前徵求核准"],
        models: [
            "在本機執行",
            "學術檢索",
            "單次請求的搜尋次數上限",
            "選擇「新增服務」",
        ],
        addProvider: "新增服務",
        provider: [
            "服務名稱",
            "端點位址",
            "測試串流輸出、工具呼叫和影像輸入",
            "支援視覺",
            "測試端點",
        ],
        invalidUrl: "請輸入有效的 URL",
        actions: ["匯入", "新增動作", "摘要文獻", "撰寫文獻回顧"],
        addAction: "新增動作",
        editor: ["動作標題", "斜線命令", "提示詞", "適用範圍", "儲存"],
        advanced: [
            "自訂指令",
            "本機文件快取",
            "掃描文件 OCR",
            "全文語意檢索",
            "研究資料同步",
            "用淺白的文字解釋這篇論文中選取的段落或註解",
            "啟用 MCP 伺服器",
        ],
    },
};

async function waitFor(read, label) {
    for (let i = 0; i < 100; i++) {
        const value = read();
        if (value) return value;
        await sleep(100);
    }
    throw Error("Settings did not render: " + label);
}

const copyOf = (element) =>
    [
        element.textContent,
        ...Array.from(
            element.querySelectorAll("[title], [aria-label], [placeholder]"),
            (node) =>
                ["title", "aria-label", "placeholder"]
                    .map((attribute) => node.getAttribute(attribute) ?? "")
                    .join(" "),
        ),
    ]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

function requireCopy(copy, expected, section) {
    for (const text of expected) {
        if (!copy.includes(text))
            throw Error(section + " missing " + text + " in " + copy);
    }
}

async function chooseSettingsLanguage(hostLocale, targetLocale) {
    if (Zotero.locale !== hostLocale)
        throw Error("Unexpected host locale: " + Zotero.locale);
    const prefs = Zotero.Utilities.Internal.openPreferences(
        "astermargin-prefpane",
    );
    const nativeButton = await waitFor(
        () => prefs.document.getElementById("astermargin-open-prefs-btn"),
        "Zotero preferences button",
    );
    nativeButton.doCommand();
    const settings = await waitFor(
        () => Services.wm.getMostRecentWindow("astermargin:preferences"),
        "settings window",
    );
    const select = await waitFor(
        () =>
            settings.document.getElementById("astermargin-interface-language"),
        "interface language selector",
    );
    const value = targetLocale === "en-US" ? "en" : targetLocale;
    if (select.value !== "auto")
        throw Error("A fresh profile must follow Zotero");
    select.value = value;
    select.dispatchEvent(new settings.Event("change", { bubbles: true }));
    const key = "extensions.zotero.astermargin.interfaceLanguage";
    await waitFor(
        () => Zotero.Prefs.get(key, true) === value,
        "saved language choice",
    );
    const expected = {
        "en-US": "Language saved.",
        "zh-CN": "语言已保存。",
        "zh-TW": "語言已儲存。",
    };
    await waitFor(
        () =>
            settings.document
                .getElementById("astermargin-preferences-panel")
                .textContent.includes(expected[hostLocale]),
        "restart message",
    );
    settings.close();
    prefs.close();
}

async function inspectWindowMenus(locale) {
    const labels = {
        "en-US": ["File", "New Chat", "Edit", "Undo", "Table", "Export to Excel…"],
        "zh-CN": ["文件", "新对话", "编辑", "撤销", "表格", "导出为 Excel…"],
        "zh-TW": ["檔案", "新對話", "編輯", "復原", "表格", "匯出為 Excel…"],
    }[locale];
    const chat = await waitFor(
        () => Services.wm.getMostRecentWindow("astermargin:window"),
        "standalone chat window",
    );
    const label = (doc, selector) => doc.querySelector(selector)?.getAttribute("label");
    const chatLabels = () => [
        label(chat.document, "#fileMenu"),
        label(chat.document, "menuitem[command='cmd_astermarginNewChat']"),
    ];
    const chatMenu = await waitFor(() => chatLabels().every((value, i) => value === labels[i]) && chatLabels(), "localized standalone dropdown " + locale);
    const ref = await createFixtureTable("Isolated menu fixture", Zotero.Libraries.userLibraryID);
    const opened = await Zotero.__astermarginTables.openTable(ref, { window: Zotero.getMainWindow(), openIn: "window" });
    if (!opened.ok) throw Error("Table window could not open: " + JSON.stringify(opened));
    const table = await waitFor(
        () => Services.wm.getMostRecentWindow("astermargin:table"),
        "standalone table window",
    );
    const tableLabels = () => [
        label(table.document, "#edit-menu"),
        label(table.document, "#menu_undo"),
        label(table.document, "#astermargin-table-menu"),
        label(table.document, "menuitem[command='cmd_astermarginTableExportXlsx']"),
    ];
    const tableMenu = await waitFor(() => tableLabels().every((value, i) => value === labels[i + 2]) && tableLabels(), "localized table dropdown " + locale);
    table.close();
    return { chat: chatMenu, table: tableMenu };
}

async function inspectSettings(locale, hostLocale) {
    if (Zotero.locale !== hostLocale)
        throw Error("Unexpected Zotero locale: " + Zotero.locale);
    const activeLocale = Zotero.AsterMargin.interfaceLocale;
    if (activeLocale !== (locale === "en-US" ? "en" : locale))
        throw Error("Unexpected AsterMargin locale: " + activeLocale);
    const expected = settingsExpectations[locale];
    const mainWindow = Zotero.getMainWindow();
    const findSettings = () => {
        const win = Services.wm.getMostRecentWindow("astermargin:preferences");
        return win &&
            !win.closed &&
            win.document.getElementById("astermargin-preferences-panel")
            ? win
            : null;
    };
    const settingsLabel = {
        "en-US": "Settings",
        "zh-CN": "设置",
        "zh-TW": "設定",
    }[locale];
    const sidebarMenu = await waitFor(
        () =>
            Array.from(
                mainWindow.document.querySelectorAll(
                    "#astermargin-react-root-sidebar button[aria-haspopup='menu']",
                ),
            ).find(
                (button) =>
                    button.getAttribute("aria-label") === expected.title ||
                    button.getAttribute("aria-label") ===
                        "AsterMargin settings",
            ),
        "sidebar settings menu",
    );
    sidebarMenu.click();
    const settingsItem = await waitFor(
        () =>
            Array.from(
                mainWindow.document.querySelectorAll("[role='menuitem']"),
            ).find((item) => item.textContent.trim() === settingsLabel),
        "sidebar settings command",
    );
    settingsItem.click();
    const sidebarSettings = await waitFor(
        findSettings,
        "settings opened by sidebar menu",
    );
    sidebarSettings.close();
    await waitFor(() => !findSettings(), "sidebar settings closed");

    const nativeWindow = Zotero.Utilities.Internal.openPreferences(
        "astermargin-prefpane",
    );
    const nativeButton = await waitFor(() => {
        const node = nativeWindow.document.getElementById(
            "astermargin-open-prefs-btn",
        );
        return node?.getAttribute("label") ? node : null;
    }, "native pane");
    const nativeCopy =
        nativeButton.getAttribute("label") +
        " " +
        nativeWindow.document.getElementById("astermargin-zotero-prefpane")
            .textContent;
    requireCopy(nativeCopy, expected.native, "native pane");
    nativeButton.doCommand();
    const win = await waitFor(
        findSettings,
        "settings opened by Zotero preferences button",
    );
    nativeWindow.close();
    await waitFor(() => nativeWindow.closed, "Zotero preferences closed");
    win.focus();
    const doc = win.document;
    const panel = await waitFor(
        () => doc.getElementById("astermargin-preferences-panel"),
        "preferences panel",
    );
    const title = await waitFor(() => {
        const root = doc.documentElement;
        const value = root.getAttribute("title");
        return root.getAttribute("lang") === activeLocale && value?.includes(expected.title)
            ? value
            : null;
    }, "localized preferences window title");
    const sections = {};
    const tab = (id) => doc.getElementById("astermargin-preferences-tab-" + id);
    const button = (label) =>
        Array.from(panel.querySelectorAll("button")).find(
            (el) => el.textContent.trim() === label,
        );
    for (const id of [
        "general",
        "sync",
        "permissions",
        "models",
        "actions",
        "advanced",
    ]) {
        tab(id).click();
        await waitFor(
            () => tab(id).getAttribute("aria-selected") === "true",
            "select settings section " + id,
        );
        await waitFor(
            () => copyOf(panel).includes(expected[id][0]),
            id + " content",
        );
        sections[id] = copyOf(panel);
        const expectedCopy = id === "models" && __SEED_RESEARCH__
            ? [...expected.models.slice(0, -1), "Isolated provider", "fixture-model"]
            : expected[id];
        requireCopy(sections[id], expectedCopy, id);

        if (id === "permissions") {
            button(expected.permissions[2]).click();
            await waitFor(
                () =>
                    copyOf(
                        doc.getElementById("astermargin-pane-preferences"),
                    ).includes(expected.approval[0]),
                "approval menu",
            );
            sections.approval = copyOf(
                doc.getElementById("astermargin-pane-preferences"),
            );
            requireCopy(sections.approval, expected.approval, "approval menu");
            tab(id).click();
        } else if (id === "models") {
            button(expected.addProvider).click();
            const input = await waitFor(
                () =>
                    Array.from(panel.querySelectorAll("input")).find(
                        (el) =>
                            el.getAttribute("aria-label") ===
                            expected.provider[1],
                    ),
                "endpoint field",
            );
            sections.provider = copyOf(panel);
            requireCopy(
                sections.provider,
                expected.provider,
                "provider editor",
            );
            // Use the native setter so React sees a user-style input event.
            Object.getOwnPropertyDescriptor(
                win.HTMLInputElement.prototype,
                "value",
            ).set.call(input, "invalid-url");
            input.dispatchEvent(new win.Event("input", { bubbles: true }));
            await waitFor(
                () => copyOf(panel).includes(expected.invalidUrl),
                "endpoint validation",
            );
            sections.validation = expected.invalidUrl;
            if (__PROVIDER_FIXTURE_ENDPOINT__ && __UPDATE_CENTER__ === "manual") {
                const card = input.closest(".action-card-editing");
                const key = card.querySelector("input[type='password']");
                const loadLabel = {
                    "en-US": "Load models from endpoint",
                    "zh-CN": "从端点加载模型",
                    "zh-TW": "從端點載入模型",
                }[locale];
                const load = () => [...card.querySelectorAll("button")].find(node => node.textContent.trim() === loadLabel);
                const setInput = (el, text) => {
                    Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set.call(el, text);
                    el.dispatchEvent(new win.Event("input", { bubbles: true }));
                };
                if (!(input.compareDocumentPosition(key) & win.Node.DOCUMENT_POSITION_FOLLOWING))
                    throw Error("Endpoint did not precede API key");
                setInput(input, __PROVIDER_FIXTURE_ENDPOINT__);
                setInput(key, "isolated-provider-key");
                (await waitFor(() => load() && !load().disabled && load(), "model discovery button")).click();
                const model = await waitFor(
                    () => card.querySelector('select option[value="isolated-catalogue-model"]'),
                    "endpoint model catalogue",
                );
                model.parentElement.value = model.value;
                model.parentElement.dispatchEvent(new win.Event("change", { bubbles: true }));
                await waitFor(
                    () => [...card.querySelectorAll("input")].some(el => el.value === "32768") &&
                        card.querySelector("[role='switch'][aria-checked='true']"),
                    "discovered context window and vision",
                );
                sections.discovery = model.value;
            }
        } else if (id === "actions") {
            button(expected.addAction).click();
            await waitFor(
                () => panel.querySelector(".action-card-editing"),
                "action editor",
            );
            sections.editor = copyOf(
                panel.querySelector(".action-card-editing"),
            );
            requireCopy(sections.editor, expected.editor, "action editor");
        }
    }
    tab("general").click();
    if (Services.vc.compare(Zotero.AsterMargin.pluginVersion, "0.1.7") >= 0) {
        if (Services.vc.compare(Zotero.AsterMargin.pluginVersion, "0.1.8") >= 0) tab("about").click();
        const check = await waitFor(
            () => doc.getElementById("astermargin-check-updates"),
            "AsterMargin update center",
        );
        const updateButton = { "en-US": "Check for updates", "zh-CN": "检查更新", "zh-TW": "檢查更新" }[locale];
        const automaticToggle = { "en-US": "Automatic updates", "zh-CN": "自动更新", "zh-TW": "自動更新" }[locale];
        requireCopy(check.textContent, [updateButton], "update check button");
        requireCopy(copyOf(panel), [automaticToggle], "automatic updates");
    }
    const dark = win.matchMedia("(prefers-color-scheme: dark)").matches;
    if (__THEME__ && dark !== (__THEME__ === "dark")) throw Error("Unexpected settings theme");
    const updates = __UPDATE_CENTER__ ? await inspectUpdates(win, locale, __UPDATE_CENTER__, __UPDATE_FIXTURE_VERSION__) : null;
    if (!win.closed) win.close();
    return {
        locale,
        theme: dark ? "dark" : "light",
        updates,
        hostLocale,
        title,
        native: nativeCopy.trim(),
        entryPoints: ["sidebar menu", "Zotero preferences button"],
        sections,
    };
}
