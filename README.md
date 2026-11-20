# AsterMargin · 星笺 · 星箋

A local-first research assistant for Zotero Desktop 7–10. The development build is based on Beaver v0.27.0-beta.4 and Beaver Local. The current feature and verification record is in [ACCEPTANCE.md](ACCEPTANCE.md). Physics-specific tools follow completion of the Beaver baseline.

## 简体中文

在 Zotero 的「工具 → 插件」中打开齿轮菜单，选择「从文件安装插件」，打开 `dist/astermargin.xpi`。首次使用时在星笺设置的「API 密钥 → 自定义模型服务」中添加服务。填写服务地址、界面显示名、服务端模型名和协议。OpenRouter 或兼容服务选择 OpenAI Chat Completions。也可以选择 Responses、Anthropic 或 Gemini。本机免密服务可留空密钥。使用「测试端点」检查连通性，能力测试另发三个请求，分别检查流式文本、工具和图像。

默认用 ⌘Y（Windows/Linux 用 Ctrl+Y）打开侧栏，按住 Shift 打开独立窗口，按住 Option/Alt 打开快捷提问。输入 @ 添加论文，在阅读器中选中文字或图像批注后提问。选择支持视觉的模型才能发送图像。端点会收到当前问题及完成任务所需的上下文。文献库排除项在设置中管理。

在「高级」中按需安装 OCR 语言包或多语言 E5 模型。可选择从本地文件或文件夹导入，所有资源在使用前按固定版本的 SHA-256 校验。模型装好后，点击「建立或更新索引」。在研究表格中保留人工修订，文献证据可定位到页或句。直接调用模型的费用取决于你的供应商。

在「高级 → 研究数据同步」中填写 WebDAV 文件夹地址，选定会话、动作或表格后点击同步。每个设备使用同一服务目录及同一 Zotero 账号/群组。请使用支持强 ETag 和条件 PUT 的服务。冲突面板可查看并选择应保留的版本。当前版本采用手动同步，表格的远程删除需要人工处理。

## 繁體中文

在 Zotero「工具 → 附加元件」的齒輪選單選擇從檔案安裝，開啟 `dist/astermargin.xpi`。在星箋設定的「API 金鑰 → 自訂模型服務」新增服務，填入服務位址、顯示名稱、模型識別碼及通訊協定。本機端點可免金鑰。先測試端點，再按需要執行串流文字、工具呼叫與影像三項測試。

使用 ⌘Y 或 Ctrl+Y 開啟側欄，加 Shift 開啟獨立視窗，加 Option/Alt 開啟快速提問。以 @ 加入文獻，或選取原文與影像註記後提問。設定支援視覺的模型才能傳送圖像。模型服務會收到問題及所需的文獻內容，可在設定中排除文獻庫。

進階設定可下載 OCR 語言檔與 E5 多語模型，亦可從檔案或資料夾離線匯入。程式核對 SHA-256 後才啟用資源，請按「建立或更新索引」建立全文語意索引。研究表格保留手動修訂與版本記錄。WebDAV 同步可選對話、自訂動作或研究表格，請使用支援強 ETag 的服務。在各裝置手動執行同步，遇到衝突可檢視並選擇修訂版本。

## English

Install `dist/astermargin.xpi` using Tools → Plugins → gear → Install Plugin From File. Under AsterMargin Settings → API Keys, add a custom provider with a display name, exact model identifier, protocol and base URL. Use an OpenAI-compatible endpoint for OpenRouter, Ollama or llama.cpp. Local loopback endpoints may omit the key. The endpoint check sends a text request. The optional three-part capability probe sends synthetic content and tests text streaming, tool calls and images.

Use Cmd/Ctrl+Y for the sidebar, add Shift for a separate window or Option/Alt for a quick question. Attach papers with @ or select text in the reader. The model receives the material needed for the task. Check library exclusions before choosing a remote provider. Advanced settings offer optional verified OCR language files, model-folder import and multilingual semantic indexing. Trigger indexing after installing the model. Research sync supports a user-provided WebDAV directory, per-dataset sync and explicit resolution of divergent revisions. Use the same library identity on each device.

## Building from source

Use Node 24 and npm. Run `npm ci`, then `npm run build`. Run `npm test` for unit and integration-style tests with independent worker processes. The package is produced at `dist/astermargin.xpi`. No public update service is configured for this development build. The local database is `astermargin.sqlite` in the Zotero data directory. See [license and attributions](THIRD_PARTY_NOTICES.md).
