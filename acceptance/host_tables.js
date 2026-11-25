const readTable = (ref) => Zotero.AsterMargin.libraryOperations.run("table_openTable", [ref]);

async function createFixtureTable(label, libraryID) {
    const table = await Zotero.AsterMargin.libraryOperations.run("table_createTable", [{
        libraryID,
        title: label,
        actor: "user",
        spec: {
            id: Zotero.Utilities.randomString(12),
            title: label,
            anchor_column_id: "_reference",
            columns: [
                { id: "_reference", header: "Reference", type: "reference", system: true },
                { id: "_year", header: "Year", type: "date", system: true },
                { id: "_identifier", header: "Identifier", type: "link", system: true },
                { id: "outcome", header: "Detected", type: "boolean", description: "Was a signal detected?" },
                { id: "method", header: "Method", type: "text", description: "Which method was used?" },
            ],
            rows: [],
        },
    }]);
    return { libraryID, key: table.key };
}

async function seedResearchData(addon) {
    const id = Zotero.Utilities.randomString(20);
    const history = addon.db.localHistory;
    const now = new Date().toISOString();
    await history.save({
        id, thread_id: id, created_at: now, status: "completed",
        user_prompt: { content: "Isolated upgrade conversation" },
        model_messages: [],
    });
    const libraryID = Zotero.Libraries.userLibraryID;
    await history.replaceEmbeddings(id, libraryID, "upgrade-fixture", [{ page: 1, text: "An indexed abstract", vector: [1, 0] }]);
    await addon.vault.write("openAiApiKey", "isolated-test-key");
    await addon.vault.write("customChatModels", JSON.stringify([{
        name: "Isolated provider", snapshot: "fixture-model", format: "openai",
        api_base: "http://127.0.0.1:9/v1", api_key: "isolated-test-key",
    }]));
    return { id, table: await createFixtureTable("Isolated upgrade table", libraryID) };
}

async function verifyResearchData(addon, data) {
    const thread = await addon.db.localHistory.getThread(data.id);
    const stamp = await addon.db.localHistory.embeddingStamp(data.id);
    const table = await readTable(data.table);
    const valid = {
        thread: thread.name === "Isolated upgrade conversation",
        index: stamp === "upgrade-fixture",
        modelCredential: addon.vault.read("openAiApiKey") === "isolated-test-key",
        modelConfig: JSON.parse(addon.vault.read("customChatModels"))[0].snapshot === "fixture-model",
        table: table.spec.title === "Isolated upgrade table" && table.version === 1,
    };
    if (Object.values(valid).some((state) => !state)) throw Error("Update lost research data: " + JSON.stringify(valid));
    return valid;
}

async function inspectResearchTable(item) {
    const win = Zotero.getMainWindow();
    const doc = win.document;
    const addon = Zotero.AsterMargin;
    const table = await createFixtureTable("Isolated research table", item.libraryID);
    const search = new Zotero.Search();
    search.libraryID = item.libraryID;
    search.name = "Isolated saved search";
    search.addCondition("title", "is", item.getField("title"));
    await search.saveTx();
    const added = await addon.libraryOperations.run("table_applyUserEdit", [table, {
        add_sources: [{ type: "library", scope: { kind: "saved_search", library_ref: "u", key: search.key } }],
    }, { seal: true }]);
    const row = added.spec?.rows[0];
    if (!added.ok || !row || added.spec.rows.length !== 1 || row.ref?.zotero_key !== item.key) {
        throw Error("Saved search did not populate the table: " + JSON.stringify(added));
    }

    const edit = await addon.libraryOperations.run("table_applyUserCellEdit", [table, [{
        op: "answer", row: row.id, column: "outcome", value: { kind: "boolean", value: true },
    }]]);
    if (!edit.ok) throw Error("Could not seed user answer: " + JSON.stringify(edit));
    const before = await readTable(table);
    const api = Zotero.__astermarginTables;
    const shown = await api.openTable(table, { window: win, openIn: "tab" });
    if (!shown.ok) throw Error(JSON.stringify(shown));
    const tableGrid = () => doc.querySelector(".rt-grid");
    const menuItem = (label) => [...doc.querySelectorAll("[role='menuitem']")].find((el) => el.innerText.trim() === label);
    const header = (id) => doc.querySelector(`th[data-column-id="${id}"]`);
    const menu = async (id, label) => {
        const button = await waitFor(() => header(id)?.querySelector(".rt-column-menu button"), id + " menu");
        button.click();
        (await waitFor(() => menuItem(label), label)).click();
    };
    const columns = () => [...(tableGrid()?.querySelectorAll("th[data-column-drag]") ?? [])].map((el) => el.dataset.columnId);
    await waitFor(() => columns().join(",") === "outcome,method", "research table rendered");
    await menu("outcome", "Filter");
    (await waitFor(() => menuItem("Yes"), "boolean filter")).click();
    await waitFor(() => header("outcome")?.querySelector(".rt-th-filter"), "active filter marker");

    // Drag a rendered header using its actual geometry, crossing the other
    // question's midpoint. Then move it back using the column menu.
    const scroller = tableGrid().parentElement;
    scroller.scrollLeft = scroller.scrollWidth;
    const from = header("outcome").getBoundingClientRect();
    const to = header("method").getBoundingClientRect();
    const y = Math.round(from.top + from.height / 2);
    const emit = (node, type, x) => node.dispatchEvent(
        new win.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: Math.round(x), clientY: y }),
    );
    emit(header("outcome").querySelector(".rt-th-label"), "mousedown", from.left + from.width / 2);
    const dropX = Math.min(to.left + to.width * 0.75, scroller.getBoundingClientRect().right - 4);
    emit(doc, "mousemove", dropX);
    const indicator = tableGrid().querySelector(".rt-drop-indicator");
    if (indicator.style.display !== "block") {
        throw Error("No drag indicator: " + JSON.stringify({
            from: from.toJSON(), to: to.toJSON(), view: scroller.getBoundingClientRect().toJSON(), dropX, y,
        }));
    }
    emit(doc, "mouseup", dropX);
    await waitFor(() => columns().join(",") === "method,outcome", "column drag saved");
    await menu("outcome", "Move left");
    await waitFor(() => columns().join(",") === "outcome,method", "move using column menu");

    win.Zotero_Tabs.close(shown.tabID);
    await waitFor(() => !tableGrid(), "closed table");
    const reopened = await api.openTable(table, { window: win, openIn: "tab" });
    if (!reopened.ok) throw Error("Could not reopen the table");
    await waitFor(() => header("outcome")?.querySelector(".rt-th-filter"), "reopened table retained column filter");

    const view = await readTable(table);
    if (view.spec.rows[0].cells.outcome.provenance !== "user") throw Error("Moving columns lost the user answer");
    const plan = await addon.tableFills.plan(table, { kind: "cells", rows: [row.id] });
    if (!plan.ok || plan.plan.cells !== 1 || plan.plan.title_abstract !== 1) {
        throw Error("Fill plan included the user answer or lost the abstract fallback: " + JSON.stringify(plan));
    }

    const reverted = await addon.libraryOperations.run("table_revertTable", [table, before.version, { actor: "user" }]);
    const latest = await readTable(table);
    if (!reverted.ok || latest.version <= view.version || latest.spec.rows[0].cells.outcome.provenance !== "user") {
        throw Error("Version restore did not create a new version with the user answer");
    }
    await addon.exporter.writeTableWorkbook(__HOST_WORKBOOK__, latest.spec);
    const workbook = await IOUtils.read(__HOST_WORKBOOK__, { maxBytes: 4 });
    if (workbook[0] !== 0x50 || workbook[1] !== 0x4B) throw Error("Excel export is not an XLSX archive");
    win.Zotero_Tabs.close(reopened.tabID);
    return { savedSearch: true, drag: true, moveMenu: true, retainedFilter: true, userAnswer: true, abstractFallback: true, restored: latest.version, workbook: __HOST_WORKBOOK__ };
}
