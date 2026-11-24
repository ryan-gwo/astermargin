const homeCopy = {
    "en-US": {
        categories: ["Research", "Write", "Organize", "Annotate"],
        currentFile: "Current File",
        actions: [
            "Create a research table",
            "Write a literature review",
            "Tidy up my library",
            "Skim this paper",
        ],
        tooltip: "Ask and explore your library",
        addSources: "Add Sources",
        sources: ["Filter by Collections", "Filter by Tags", "Add Note"],
        search: "Search by author, year and title",
        webSearch: "Web search",
    },
    "zh-CN": {
        categories: ["研究", "写作", "整理", "批注"],
        currentFile: "当前文件",
        actions: [
            "创建研究表格",
            "撰写文献综述",
            "整理我的文献库",
            "速读这篇论文",
        ],
        tooltip: "检索与探索文献库",
        addSources: "添加来源",
        sources: ["按分类筛选", "按标签筛选", "添加笔记"],
        search: "按作者、年份和标题检索",
        webSearch: "网页搜索",
    },
    "zh-TW": {
        categories: ["研究", "寫作", "整理", "註解"],
        currentFile: "目前檔案",
        actions: [
            "建立研究表格",
            "撰寫文獻回顧",
            "整理我的文獻庫",
            "略讀這篇論文",
        ],
        tooltip: "檢索與探索文獻庫",
        addSources: "新增來源",
        sources: ["依分類篩選", "依標籤篩選", "新增筆記"],
        search: "依作者、年份及標題搜尋",
        webSearch: "網頁搜尋",
    },
};

async function inspectHome(locale, parentItem) {
    const expected = homeCopy[locale];
    const win = Zotero.getMainWindow();
    // The screenshot came from the reader's sidebar. Use a real attachment so
    // Zotero supplies the reader context and the composer creates its file chip.
    const attachment = await Zotero.Attachments.importFromFile({
        file: Zotero.File.pathToFile(__HOME_PDF__),
        parentItemID: parentItem.id,
    });
    await Zotero.Reader.open(attachment.id);

    const readerHome = () =>
        Array.from(win.document.querySelectorAll("#welcome-page")).find(
            (element) => element.getBoundingClientRect().width > 0,
        );
    const home = await waitFor(readerHome, "homepage in Zotero reader");
    const categoryButtons = Array.from(
        home.querySelectorAll("button[aria-pressed]"),
    ).filter((button) => !button.getAttribute("aria-label"));
    const categories = categoryButtons.map((button) =>
        button.textContent.trim(),
    );
    if (JSON.stringify(categories) !== JSON.stringify(expected.categories)) {
        throw Error(
            "Homepage categories: expected " +
                expected.categories.join(", ") +
                ", got " +
                categories.join(", "),
        );
    }
    await waitFor(
        () => home.textContent.includes(expected.currentFile),
        "current reader file chip",
    );
    categoryButtons[0].dispatchEvent(
        new win.MouseEvent("mouseover", { bubbles: true }),
    );
    await waitFor(
        () => home.innerText.includes(expected.tooltip),
        "translated category tooltip",
    );
    categoryButtons[0].dispatchEvent(
        new win.MouseEvent("mouseout", { bubbles: true }),
    );
    for (const [index, button] of categoryButtons.entries()) {
        button.click();
        await waitFor(
            () =>
                button.getAttribute("aria-pressed") === "true" &&
                home.innerText.includes(expected.actions[index]),
            "translated actions for " + categories[index],
        );
        button.click();
    }

    const buttons = Array.from(home.querySelectorAll("button"));
    const sourcesButton = buttons.find(
        (button) => button.getAttribute("aria-label") === expected.addSources,
    );
    if (!sourcesButton)
        throw Error("Missing source picker button: " + expected.addSources);
    if (
        !buttons.some(
            (button) =>
                button.getAttribute("aria-label") === expected.webSearch,
        )
    ) {
        throw Error("Missing web search button: " + expected.webSearch);
    }
    sourcesButton.click();
    const menu = await waitFor(
        () =>
            Array.from(win.document.querySelectorAll("[role='menu']")).find(
                (element) =>
                    expected.sources.every((label) =>
                        element.textContent.includes(label),
                    ),
            ),
        "translated source picker",
    );
    requireCopy(
        copyOf(menu.parentElement),
        [expected.search],
        "source picker search field",
    );
    sourcesButton.click();

    // Return to the library so the generic smoke test can check quick prompt.
    win.Zotero_Tabs.select("zotero-pane");
    return {
        categories,
        readerChip: expected.currentFile,
        actions: expected.actions,
        sources: expected.sources,
    };
}
