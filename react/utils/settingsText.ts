import { interfaceLocale } from "../../src/utils/interfaceLanguage";
import { builtinActionMessages } from "../../src/utils/actionDisplayText";

// Settings messages use English as their source key. Keep both Chinese translations with each key.
const messages = {
    ...builtinActionMessages,
    Updates: ["更新", "更新"],
    "Current version {version}": ["当前版本 {version}", "目前版本 {version}"],
    "Stable channel": ["稳定版渠道", "穩定版管道"],
    "Last manual check {time}": [
        "上次手动检查于 {time}",
        "上次手動檢查於 {time}",
    ],
    "No manual checks yet": ["尚未手动检查", "尚未手動檢查"],
    "Automatic updates": ["自动更新", "自動更新"],
    "Use Zotero to install stable updates automatically.": [
        "通过 Zotero 自动安装稳定版更新。",
        "透過 Zotero 自動安裝穩定版更新。",
    ],
    "Following Zotero default (on)": [
        "跟随 Zotero 默认设置（开启）",
        "跟隨 Zotero 預設設定（開啟）",
    ],
    "Following Zotero default (off)": [
        "跟随 Zotero 默认设置（关闭）",
        "跟隨 Zotero 預設設定（關閉）",
    ],
    "On for AsterMargin": ["星笺已开启自动更新", "星箋已開啟自動更新"],
    "Off for AsterMargin": ["星笺已关闭自动更新", "星箋已關閉自動更新"],
    "Follow Zotero default": ["跟随 Zotero 默认设置", "跟隨 Zotero 預設設定"],
    "Background update checks are disabled in Zotero.": [
        "Zotero 已关闭后台检查更新。",
        "Zotero 已關閉背景檢查更新。",
    ],
    "Check for updates": ["检查更新", "檢查更新"],
    "Checking for updates…": ["正在检查更新…", "正在檢查更新…"],
    "No compatible update is available.": [
        "没有可用的兼容更新。",
        "目前沒有相容的更新。",
    ],
    "Version {version} is available": [
        "可更新至 {version}",
        "可更新至 {version}",
    ],
    "Released {date}": ["发布于 {date}", "發布於 {date}"],
    "Release date unavailable": ["暂无发布日期", "暫無發布日期"],
    "Release summary unavailable.": [
        "暂时无法获取更新摘要。",
        "暫時無法取得更新摘要。",
    ],
    "View release notes": ["查看发布说明", "查看發布說明"],
    "Update now": ["立即更新", "立即更新"],
    "Installing update…": ["正在安装更新…", "正在安裝更新…"],
    "Update installed.": ["更新已安装。", "更新已安裝。"],
    "Restart Zotero to finish installing the update.": [
        "请重启 Zotero 以完成更新。",
        "請重新啟動 Zotero 以完成更新。",
    ],
    "Could not check for updates. Try again.": [
        "检查更新失败，请重试。",
        "檢查更新失敗，請重試。",
    ],
    "Could not install the update. Check for updates again.": [
        "安装更新失败，请重新检查更新。",
        "安裝更新失敗，請重新檢查更新。",
    ],
    "The update file failed verification. Check for updates again.": [
        "更新安装包校验失败，请重新检查更新。",
        "更新安裝套件驗證失敗，請重新檢查更新。",
    ],
    "Could not change automatic updates.": [
        "无法更改自动更新设置。",
        "無法變更自動更新設定。",
    ],
    "Zotero update controls are unavailable.": [
        "暂时无法访问 Zotero 的更新设置。",
        "暫時無法存取 Zotero 的更新設定。",
    ],
    "Interface language": ["界面语言", "介面語言"],
    "Follow Zotero": ["跟随 Zotero", "跟隨 Zotero"],
    "Choose the language of AsterMargin. Changes apply after restarting Zotero.":
        [
            "选择星笺的界面语言。重启 Zotero 后生效。",
            "選擇星箋的介面語言。重新啟動 Zotero 後生效。",
        ],
    "Language saved. Restart Zotero to apply it.": [
        "语言已保存。重启 Zotero 后生效。",
        "語言已儲存。重新啟動 Zotero 後生效。",
    ],
    "Settings sections": ["设置分类", "設定分類"],
    "End your current session": ["结束当前会话", "結束目前的工作階段"],
    "Sign out": ["退出登录", "登出"],
    "Not signed in": ["尚未登录", "尚未登入"],
    "Terms of Service": ["服务条款", "服務條款"],
    "Privacy Policy": ["隐私政策", "隱私權政策"],
    Sidebar: ["侧栏", "側邊欄"],
    "Keyboard Shortcut": ["键盘快捷键", "鍵盤快速鍵"],
    "Sidebar: {sidebar} · Window: {window} · Quick prompt: {quick} · Changes require restart":
        [
            "侧栏：{sidebar} · 独立窗口：{window} · 快捷提问：{quick} · 重启后生效",
            "側邊欄：{sidebar} · 獨立視窗：{window} · 快速提問：{quick} · 重新啟動後生效",
        ],
    "Add Selected Items and Collections to New Threads": [
        "将选中的条目和分类添加到新对话",
        "將選取的項目和分類加入新對話",
    ],
    "Automatically attach selected items and collections to new threads": [
        "新建对话时自动添加选中的条目和分类",
        "新增對話時自動加入選取的項目和分類",
    ],
    "When enabled, selected Zotero items and collections are attached when you start a new conversation, including from the quick prompt.":
        [
            "新建对话时自动添加 Zotero 中选中的条目和分类，也适用于快捷提问。",
            "新增對話時會自動加入 Zotero 中選取的項目和分類，也適用於快速提問。",
        ],
    "Add Selected Items When Opening": [
        "打开时添加选中的条目",
        "開啟時加入選取的項目",
    ],
    "Automatically attach selected items when opening AsterMargin": [
        "打开星笺时自动添加选中的条目",
        "開啟星箋時自動加入選取的項目",
    ],
    "When enabled, any items you have selected in Zotero will be automatically added as sources when you open AsterMargin.":
        [
            "打开星笺时，Zotero 中选中的条目会自动作为来源添加。",
            "開啟星箋時，Zotero 中選取的項目會自動加入為來源。",
        ],
    "Run Status Popup": ["任务进度浮窗", "工作進度浮視窗"],
    "Show what AsterMargin is doing in the corner of the window while the sidebar is closed":
        [
            "关闭侧栏时，在窗口角落显示星笺的任务进度",
            "關閉側邊欄時，在視窗角落顯示星箋的工作進度",
        ],
    "When enabled, a small card in the bottom-right corner of the Zotero window shows the current run's progress, lets you approve pending changes, and reports when a response is ready.":
        [
            "在 Zotero 窗口右下角显示当前任务的进度、待批准的更改和回答完成通知。",
            "在 Zotero 視窗右下角顯示目前工作的進度、待核准的變更和回覆完成通知。",
        ],
    Citations: ["引文", "引文"],
    "Citation Format: {format}": ["引文格式：{format}", "引文格式：{format}"],
    Numeric: ["数字编号", "數字編號"],
    "Author-Year": ["作者－年份", "作者－年份"],
    "Choose between numeric [1] or author-year (Smith, 2023) citations": [
        "选择数字编号 [1] 或作者－年份（Smith, 2023）格式",
        "選擇數字編號 [1] 或作者－年份（Smith, 2023）格式",
    ],
    "Keep Cited Passages Highlighted": [
        "保留引文原文的高亮",
        "保留引文原文的醒目提示",
    ],
    "When enabled, AsterMargin marks cited passages with temporary Zotero annotations that disappear on your next click. When disabled, AsterMargin briefly flashes the passage instead.":
        [
            "启用时用临时批注标记引文原文，点击后清除。关闭后只会短暂闪烁提示。",
            "啟用時會以臨時註解標記引文原文，點按後清除。停用後只會短暫閃爍提示。",
        ],
    "When disabled, citations use Zotero's transient PDF position highlight instead.":
        [
            "关闭后，跳转引文时使用 Zotero 的短暂定位高亮。",
            "停用後，跳轉引文時會使用 Zotero 短暫的定位醒目提示。",
        ],
    Notes: ["笔记", "筆記"],
    "Add Provenance Note to Imported Items": [
        "为导入的条目添加溯源笔记",
        "為匯入的項目加入溯源筆記",
    ],
    "Add a child note with a conversation link to AsterMargin conversation": [
        "创建子笔记并附上星笺对话链接",
        "建立子筆記並附上星箋對話連結",
    ],
    "Preview Note Edits in Editor": [
        "在编辑器中预览笔记改动",
        "在編輯器中預覽筆記變更",
    ],
    "Show proposed note edits inline in the Zotero note editor": [
        "在 Zotero 笔记编辑器中显示拟议改动",
        "在 Zotero 筆記編輯器中顯示建議變更",
    ],
    "Requires Zotero 8 — unavailable on this version": [
        "此功能需要 Zotero 8 或更新版本",
        "此功能需要 Zotero 8 或更新版本",
    ],
    "When enabled, edit_note proposals appear as a colored diff directly in the note editor with Apply / Reject controls. When disabled, approvals fall back to the sidebar preview. Turn off if a Zotero update causes the in-editor preview to misbehave.":
        [
            "在笔记编辑器中用颜色标记增删内容，并提供应用和拒绝按钮。关闭后可在侧栏预览并审批。Zotero 更新后如果编辑器内的预览异常，可关闭此功能。",
            "在筆記編輯器中以色彩標記增刪內容，並提供套用和拒絕按鈕。停用後可在側邊欄預覽並審核。若更新 Zotero 後編輯器內的預覽異常，可停用此功能。",
        ],
    Accessibility: ["无障碍", "輔助使用"],
    "Chat Line Spacing": ["对话行距", "對話行距"],
    "Adjust the space between lines in chat messages": [
        "调整对话消息的行间距",
        "調整對話訊息的行距",
    ],
    Standard: ["标准", "標準"],
    Relaxed: ["舒展", "寬鬆"],
    Spacious: ["宽松", "加寬"],
    "Announce Responses for Screen Readers": [
        "为屏幕阅读器播报回答",
        "用螢幕閱讀器播報回覆",
    ],
    "Move focus to screen-reader text when AsterMargin starts and finishes generating a response":
        [
            "回答开始和结束时，将焦点移到屏幕阅读器专用文本",
            "開始和結束回覆時，將焦點移到螢幕閱讀器專用文字",
        ],
    "When enabled, focus moves from the chat input to screen-reader-only status text while AsterMargin generates, then to a screen-reader-only copy of the completed response.":
        [
            "生成回答时，焦点从输入框移到屏幕阅读器专用的状态文本。生成结束后移到回答全文。",
            "產生回覆時，焦點從輸入框移到螢幕閱讀器專用的狀態文字。產生完畢後移到回覆全文。",
        ],
    Privacy: ["隐私", "隱私權"],
    "Help Improve AsterMargin": ["帮助改进星笺", "協助改善星箋"],
    "Share anonymized prompts to help improve AsterMargin": [
        "分享匿名化的提示词以改进星笺",
        "分享經過匿名化的提示詞以改善星箋",
    ],
    "When enabled, we use your prompts, queries, and AI responses to improve AsterMargin's features and performance. We automatically remove personal information and never share your PDFs, documents, or other files.":
        [
            "开启后会使用你的提示词、查询和 AI 回答来改进功能与性能。系统会移除个人信息，PDF、文档和其他附件不参与共享。",
            "啟用後會使用你的提示詞、查詢和 AI 回覆改善功能與效能。系統會移除個人資訊，PDF、文件和其他附件不會分享。",
        ],
    "Email Notifications": ["邮件通知", "電子郵件通知"],
    "Receive email updates about AsterMargin": [
        "接收星笺的邮件动态",
        "接收星箋的電子郵件消息",
    ],
    Libraries: ["文献库", "文獻庫"],
    "AsterMargin only searches, reads, and edits the libraries checked here.": [
        "星笺只会检索、读取和编辑在此勾选的文献库。",
        "星箋只會檢索、讀取和編輯在此勾選的文獻庫。",
    ],
    "Your saved library list is invalid. Check a library below to reset it.": [
        "已保存的文献库列表无效。请勾选下方的文献库以重置。",
        "已儲存的文獻庫清單無效。請勾選下方的文獻庫以重設。",
    ],
    "All libraries are unchecked. AsterMargin can't access any libraries.": [
        "当前没有勾选任何文献库，星笺无法访问文献。",
        "目前未勾選任何文獻庫，星箋無法存取文獻。",
    ],
    "Your personal library is unchecked, so AsterMargin cannot use it on any of your devices.":
        [
            "个人文献库未勾选，星笺无法在你的设备上使用该库。",
            "個人文獻庫未勾選，星箋無法在你的裝置上使用該文獻庫。",
        ],
    "Loading libraries…": ["正在加载文献库…", "正在載入文獻庫…"],
    "Waiting for your AsterMargin account to load…": [
        "正在加载星笺账户…",
        "正在載入星箋帳號…",
    ],
    "No libraries found.": ["未找到文献库。", "找不到文獻庫。"],
    "Allow AsterMargin to use {library}": [
        "允许星笺访问“{library}”",
        "允許星箋存取「{library}」",
    ],
    "Show fewer": ["收起列表", "收合清單"],
    "Show all {count} libraries": [
        "显示全部 {count} 个文献库",
        "顯示全部 {count} 個文獻庫",
    ],
    "Library Modifications": ["更改文献库", "變更文獻庫"],
    "When AsterMargin modifies your library, all changes require your approval by default (the only exception is when AsterMargin creates a new note). You can change this behavior here. Be careful, AsterMargin might make changes you didn't expect.":
        [
            "默认情况下，星笺修改文献库前会征求你的同意，创建新笔记除外。你可以在此设置各类更改的审批方式。自动应用可能导致意料之外的更改。",
            "依預設，星箋修改文獻庫前會徵求你的同意，建立新筆記除外。你可以在此設定各種變更的核准方式。自動套用可能造成非預期的變更。",
        ],
    "Editing metadata": ["编辑元数据", "編輯詮釋資料"],
    "Organizing library items": ["整理文献库条目", "整理文獻庫項目"],
    "Metadata Edits": ["编辑元数据", "編輯詮釋資料"],
    "Changes to item titles, authors, abstracts, and other metadata": [
        "修改条目的标题、作者、摘要等元数据",
        "修改項目的標題、作者、摘要等詮釋資料",
    ],
    "Note Creation": ["创建笔记", "建立筆記"],
    "Creating new Zotero notes": [
        "在 Zotero 中创建笔记",
        "在 Zotero 中建立筆記",
    ],
    "Note Edits": ["编辑笔记", "編輯筆記"],
    "Changes to Zotero note content": [
        "修改 Zotero 笔记内容",
        "修改 Zotero 筆記內容",
    ],
    "PDF Annotations": ["PDF 批注", "PDF 註解"],
    "Creating and editing annotations. Deleting annotations always asks for confirmation.":
        [
            "创建和编辑批注。删除批注始终需要确认。",
            "建立及編輯註解。刪除註解一律需要確認。",
        ],
    "Item Imports": ["导入条目", "匯入項目"],
    "Importing new items from external sources": [
        "从外部来源导入新条目",
        "從外部來源匯入新項目",
    ],
    "Item Organization": ["整理条目", "整理項目"],
    "Creating collections and adding or removing tags and collections on selected items":
        [
            "创建分类，或为选中的条目增删标签和所属分类",
            "建立分類，或為選取的項目增刪標籤和所屬分類",
        ],
    "Duplicate Merges": ["合并重复条目", "合併重複項目"],
    "Combining duplicate records with undo support": [
        "合并重复记录，可撤销",
        "合併重複記錄，可復原",
    ],
    "Tag & Collection Management": ["管理标签和分类", "管理標籤和分類"],
    "Library-wide tag and collection rename, move, merge, and delete operations":
        [
            "在整个文献库中重命名、移动、合并或删除标签和分类",
            "在整個文獻庫中重新命名、移動、合併或刪除標籤和分類",
        ],
    "Always ask": ["每次询问", "每次詢問"],
    "Always apply": ["直接应用", "直接套用"],
    "Always review later": ["稍后审阅", "稍後審閱"],
    "Prompt for approval before making changes": [
        "更改前征求批准",
        "變更前徵求核准",
    ],
    "Apply changes immediately without prompting": [
        "立即应用更改，无需确认",
        "立即套用變更，無須確認",
    ],
    "Queue changes for manual review later": [
        "将更改加入队列，留待手动审阅",
        "將變更加到佇列，留待手動審閱",
    ],
    "Select preference for {label}": [
        "设置“{label}”的审批方式",
        "設定「{label}」的核准方式",
    ],
    "System Notifications": ["系统通知", "系統通知"],
    "Approval Notifications": ["审批通知", "核准通知"],
    "Show a system notification when AsterMargin is waiting for your decision and is not visible.":
        [
            "星笺不可见且有待审批事项时发送系统通知。",
            "星箋未顯示且有待核准事項時傳送系統通知。",
        ],
    "Response Notifications": ["回答完成通知", "回覆完成通知"],
    "Show a system notification when a response is ready and AsterMargin is not visible.":
        [
            "星笺不可见且回答完成时发送系统通知。",
            "星箋未顯示且回覆完成時傳送系統通知。",
        ],
    "Auto-Apply": ["自动应用", "自動套用"],
    "Auto-Apply Annotations": ["自动应用批注", "自動套用註解"],
    "Automatically apply annotations to PDFs when created by the agent (only when PDF is open)":
        [
            "自动应用由助手创建的 PDF 批注，仅适用于已打开的 PDF",
            "自動套用由助理建立的 PDF 註解，僅適用於已開啟的 PDF",
        ],
    "File Access": ["文件访问", "檔案存取"],
    "Access Remote Files": ["访问远程文件", "存取遠端檔案"],
    "Download PDF files from the Zotero server when not available locally": [
        "本机没有 PDF 时，从 Zotero 服务器下载",
        "本機沒有 PDF 時，從 Zotero 伺服器下載",
    ],
    "When enabled, AsterMargin will attempt to download PDFs from the Zotero server or WebDAV if the file is not on your local machine. Disable this if you experience slow responses or don't want remote file downloads.":
        [
            "本机没有 PDF 时，星笺会尝试从 Zotero 服务器或 WebDAV 下载。如果下载拖慢回答，或你只想读取本机文件，可关闭此项。",
            "本機沒有 PDF 時，星箋會嘗試從 Zotero 伺服器或 WebDAV 下載。若下載讓回覆變慢，或你只想讀取本機檔案，可停用此項。",
        ],
    "Run entirely on this device": ["在本机运行", "在本機執行"],
    "Connect a custom provider directly, without an AsterMargin account.": [
        "直接连接自定义模型服务，无需星笺账户。",
        "直接連線至自訂模型服務，無須星箋帳號。",
    ],
    "This build has no AsterMargin server settings, so local mode is always on.":
        ["此版本始终使用本机模式。", "此版本一律使用本機模式。"],
    "Restart Zotero to apply this change.": [
        "重启 Zotero 后生效。",
        "重新啟動 Zotero 後生效。",
    ],
    "Round cap": ["工具调用轮数上限", "工具呼叫輪數上限"],
    "Maximum tool-calling rounds": ["工具调用轮数上限", "工具呼叫輪數上限"],
    "Limit how many tool-calling rounds a single run can take before it stops. Leave blank for the default ({count}).":
        [
            "限制单次任务的工具调用轮数。留空则使用默认值（{count}）。",
            "限制單次工作的工具呼叫輪數。留空則使用預設值（{count}）。",
        ],
    Status: ["状态", "狀態"],
    "Ready — using “{model}”.": [
        "已就绪，当前使用“{model}”。",
        "已就緒，目前使用「{model}」。",
    ],
    "Scholarly search": ["学术检索", "學術檢索"],
    "Let the model look up published research beyond your library. Its search query is sent to OpenAlex and Semantic Scholar.":
        [
            "允许模型检索库外的已发表研究。查询词会发送到 OpenAlex 和 Semantic Scholar。",
            "允許模型檢索庫外的已發表研究。查詢詞會傳送至 OpenAlex 和 Semantic Scholar。",
        ],
    "An OpenAlex key raises your search allowance and lets AsterMargin try a cached open-access PDF if Zotero cannot fetch one. Downloads use your OpenAlex allowance.":
        [
            "OpenAlex 密钥可提高检索额度。若 Zotero 无法获取 PDF，星笺会尝试下载 OpenAlex 缓存的开放获取版本。下载计入 OpenAlex 用量。",
            "OpenAlex 金鑰可提高搜尋額度。若 Zotero 無法取得 PDF，星箋會嘗試下載 OpenAlex 快取的開放取用版本。下載計入 OpenAlex 用量。",
        ],
    "OpenAlex API key": ["OpenAlex API 密钥", "OpenAlex API 金鑰"],
    "Optional. Raises Semantic Scholar's shared rate limit for these requests.":
        [
            "可选。可提高 Semantic Scholar 的请求频率上限。",
            "選填。可提高 Semantic Scholar 的請求頻率上限。",
        ],
    "Semantic Scholar API key": [
        "Semantic Scholar API 密钥",
        "Semantic Scholar API 金鑰",
    ],
    Optional: ["选填", "選填"],
    "Web search": ["网页搜索", "網頁搜尋"],
    "Max searches per request": [
        "单次请求的搜索次数上限",
        "單次請求的搜尋次數上限",
    ],
    "Most searches the provider may run for a single request. A run can make several requests. Leave blank for the default ({count}).":
        [
            "服务方在一次请求中最多可执行的搜索次数。一次任务可发出多次请求。留空则使用默认值（{count}）。",
            "服務方在一次請求中最多可執行的搜尋次數。一次工作可發出多次請求。留空則使用預設值（{count}）。",
        ],
    "Anthropic hosted search": ["Anthropic 托管搜索", "Anthropic 託管搜尋"],
    "OpenAI hosted search": ["OpenAI 托管搜索", "OpenAI 託管搜尋"],
    "OpenRouter web search": ["OpenRouter 网页搜索", "OpenRouter 網頁搜尋"],
    "Not available for this provider": [
        "此服务暂不支持网页搜索",
        "此服務目前不支援網頁搜尋",
    ],
    "{search} (may not be supported by this endpoint)": [
        "{search}（当前端点可能不支持）",
        "{search}（目前的端點可能不支援）",
    ],
    "{search}. Your provider may bill per search. This is the master switch — the composer's web-search toggle turns it on per message.":
        [
            "{search}。服务方可能按搜索次数收费。打开此总开关后，可在输入框中按消息启用网页搜索。",
            "{search}。服務方可能依搜尋次數計費。開啟總開關後，可在輸入框中針對個別訊息啟用網頁搜尋。",
        ],
    "Connect your own local or self-hosted model below. Requests go straight from this device to your endpoint — AsterMargin's backend is not involved.":
        [
            "在下方添加本机或自行托管的模型。请求会从本设备直接发送到你配置的端点。",
            "在下方新增本機或自行託管的模型。請求會從本裝置直接傳送到你設定的端點。",
        ],
    "OpenRouter, OpenAI-compatible proxies, or a local server such as Ollama or LM Studio. Requests go straight from this device to the endpoint.":
        [
            "支持 OpenRouter、OpenAI 兼容代理以及 Ollama、LM Studio 等本机服务。请求会从本机直接发送到端点。",
            "支援 OpenRouter、OpenAI 相容代理，以及 Ollama、LM Studio 等本機服務。請求會從本機直接傳送到端點。",
        ],
    "OpenRouter, OpenAI-compatible proxies, or self-hosted HTTPS endpoints. Requests are routed through AsterMargin's server. Each endpoint must be reachable from the public internet over HTTPS.":
        [
            "支持 OpenRouter、OpenAI 兼容代理或自行托管的 HTTPS 端点。请求经过星笺服务器转发，端点必须可通过公网 HTTPS 访问。",
            "支援 OpenRouter、OpenAI 相容代理或自行託管的 HTTPS 端點。請求經星箋伺服器轉送，所有端點須可透過公開網路的 HTTPS 存取。",
        ],
    "Learn more": ["了解详情", "瞭解詳情"],
    "Choose a capable model.": [
        "选择具备足够能力的模型。",
        "選擇能力足夠的模型。",
    ],
    "Select Add Provider to add custom endpoints.": [
        "选择“添加服务”以配置自定义端点。",
        "選擇「新增服務」以設定自訂端點。",
    ],
    "Enter your API Key": ["输入 API 密钥", "輸入 API 金鑰"],
    "Read more": ["查看更多", "查看更多"],
    "Copy API key": ["复制 API 密钥", "複製 API 金鑰"],
    "The provider test failed.": ["模型服务测试失败。", "模型服務測試失敗。"],
    Incomplete: ["配置未完成", "設定未完成"],
    "My Custom Model": ["我的自定义模型", "我的自訂模型"],
    "Provider name": ["服务名称", "服務名稱"],
    "Model snapshot": ["模型名称", "模型名稱"],
    "Endpoint URL": ["端点地址", "端點位址"],
    "Network requirements": ["网络要求", "網路需求"],
    "API format": ["API 格式", "API 格式"],
    "Enter a number (e.g. 128000).": [
        "请输入数字，例如 128000。",
        "請輸入數字，例如 128000。",
    ],
    "OpenRouter uses AsterMargin's built-in OpenRouter connection, so Format does not apply.":
        [
            "OpenRouter 使用星笺内置的连接方式，无需设置协议格式。",
            "OpenRouter 使用星箋內建的連線方式，無須設定協定格式。",
        ],
    "Optional for a server on this computer": [
        "使用本机服务时可留空",
        "使用本機服務時可留空",
    ],
    "Test streaming, tools and vision (3 requests)": [
        "测试流式输出、工具调用和图像输入（3 次请求）",
        "測試串流輸出、工具呼叫和影像輸入（3 次請求）",
    ],
    "Fill in all required fields to test the endpoint.": [
        "填写必填项后即可测试端点。",
        "填寫必填欄位後即可測試端點。",
    ],
    "Testing...": ["正在测试…", "正在測試…"],
    Duplicate: ["创建副本", "建立副本"],
    Delete: ["删除", "刪除"],
    Done: ["完成", "完成"],
    Storage: ["存储", "儲存空間"],
    "Data AsterMargin stores on this computer. This data is not deleted automatically including when the plugin is removed.":
        [
            "以下数据保存在本机。卸载星笺时会保留这些数据。",
            "下列資料儲存在本機。移除星箋時會保留這些資料。",
        ],
    "External Files": ["外部文件", "外部檔案"],
    "Copies of external files you attach to chats.": [
        "添加到对话中的外部文件副本。",
        "加入對話中的外部檔案副本。",
    ],
    "Delete All…": ["全部删除…", "全部刪除…"],
    "Show Folder": ["打开文件夹", "開啟資料夾"],
    "Delete External Files?": ["删除外部文件？", "刪除外部檔案？"],
    "Delete {files} attached to past chats?": [
        "删除过去对话中附加的文件（{files}）吗？",
        "要刪除以往對話附加的檔案（{files}）嗎？",
    ],
    "AsterMargin will no longer be able to read these files in past conversations.":
        [
            "删除后，星笺无法在旧对话中读取这些文件。",
            "刪除後，星箋無法在舊對話中讀取這些檔案。",
        ],
    "Files can be re-attached at any time.": [
        "你可以随时重新添加文件。",
        "你可以隨時重新加入檔案。",
    ],
    Troubleshooting: ["故障排查", "疑難排解"],
    "Connected Apps": ["已连接的应用", "已連線的應用程式"],
    Experimental: ["实验功能", "實驗功能"],
    "Lets AsterMargin in other apps access your Zotero library while Zotero is running.":
        [
            "Zotero 运行期间，允许其他应用中的星笺访问你的文献库。",
            "允許其他應用程式中的星箋在 Zotero 執行期間存取你的文獻庫。",
        ],
    "Allow Library Access": ["允许访问文献库", "允許存取文獻庫"],
    "AsterMargin chats started in connected apps can search and read this Zotero library":
        [
            "在已连接的应用中打开星笺对话时，可检索和读取此文献库",
            "在已連線的應用程式中開啟星箋對話時，可檢索及讀取此文獻庫",
        ],
    "MCP Server": ["MCP 服务器", "MCP 伺服器"],
    "The MCP server lets AI coding tools like Claude Code, Cursor, and Windsurf search and access your Zotero library.":
        [
            "MCP 服务器可让 Claude Code、Cursor、Windsurf 等 AI 工具检索和访问 Zotero 文献库。",
            "MCP 伺服器可讓 Claude Code、Cursor、Windsurf 等 AI 工具檢索及存取 Zotero 文獻庫。",
        ],
    "MCP server guide": ["MCP 服务器配置指南", "MCP 伺服器設定指南"],
    "Enable MCP Server": ["启用 MCP 服务器", "啟用 MCP 伺服器"],
    "Endpoint at localhost:{port}": [
        "本机端点：localhost:{port}",
        "本機端點：localhost:{port}",
    ],
    "Expose your Zotero library to MCP-compatible AI tools": [
        "允许兼容 MCP 的 AI 工具访问 Zotero 文献库",
        "允許相容 MCP 的 AI 工具存取 Zotero 文獻庫",
    ],
    "Enable Write Tools": ["启用写入工具", "啟用寫入工具"],
    "Allow MCP clients to create Zotero notes, highlights, and sticky-note annotations. Changing setting requires reloading of the MCP server.":
        [
            "允许 MCP 客户端创建 Zotero 笔记、高亮和便签批注。更改后需重新加载 MCP 服务器。",
            "允許 MCP 用戶端建立 Zotero 筆記、醒目提示及便利貼註解。變更後須重新載入 MCP 伺服器。",
        ],
    "Advertise and allow the MCP tools that write to your library": [
        "向 MCP 客户端公开并允许其使用写入文献库的工具",
        "向 MCP 用戶端公開並允許其使用寫入文獻庫的工具",
    ],
    "Config for HTTP Clients": ["HTTP 客户端配置", "HTTP 用戶端設定"],
    "For clients that support HTTP directly (e.g., Claude Code, Cursor).": [
        "适用于直接支持 HTTP 的客户端，例如 Claude Code 和 Cursor。",
        "適用於直接支援 HTTP 的用戶端，例如 Claude Code 和 Cursor。",
    ],
    "Config for HTTPS-Only Clients": [
        "仅支持 HTTPS 的客户端配置",
        "僅支援 HTTPS 的用戶端設定",
    ],
    "For clients that only connect to HTTPS endpoints (e.g., Claude Desktop). Requires Node.js.":
        [
            "适用于只连接 HTTPS 端点的客户端，例如 Claude Desktop。需要 Node.js。",
            "適用於只連線至 HTTPS 端點的用戶端，例如 Claude Desktop。需要 Node.js。",
        ],
    Copied: ["已复制", "已複製"],
    "Background Processing": ["后台处理", "背景處理"],
    "The current file finishes first. Processing then waits until your computer is idle.":
        [
            "处理完当前文件后暂停，等电脑空闲时继续。",
            "處理完目前的檔案後會暫停，等電腦閒置時繼續。",
        ],
    "Start now": ["立即开始", "立即開始"],
    "Start now. {reason}": ["立即开始。{reason}", "立即開始。{reason}"],
    "{done} of {total} attachments finished in this run": [
        "本次已处理 {done} 个附件，共 {total} 个",
        "本次已處理 {done} 個附件，共 {total} 個",
    ],
    "{done} of {total}": ["{done} / {total}", "{done} / {total}"],
    "The search index could not be checked. AsterMargin will try again.": [
        "无法检查检索索引。星笺将重试。",
        "無法檢查檢索索引。星箋將重試。",
    ],
    "Last reported: ": ["上次报告：", "上次回報："],
    "{files} could not be read.": ["{files}无法读取。", "{files}無法讀取。"],
    "{files} could not be indexed.": [
        "{files}无法建立索引。",
        "{files}無法建立索引。",
    ],
    "{files} could not be read or indexed.": [
        "{files}无法读取或建立索引。",
        "{files}無法讀取或建立索引。",
    ],
    "See Problems": ["查看问题", "查看問題"],
    "Cached text": ["已缓存的文本", "已快取的文字"],
    "Some processed files are no longer cached. Rebuilding prepares them again for faster responses.":
        [
            "部分已处理文件的缓存已清除。重建可再次准备这些文件，加快回答。",
            "部分已處理檔案的快取已清除。重建可再次準備這些檔案，加快回覆。",
        ],
    "Rebuild cache": ["重建缓存", "重建快取"],
    "Keep Full-Text Search Up to Date": [
        "保持全文检索索引为最新",
        "保持全文檢索索引為最新",
    ],
    "Keep full-text search up to date": [
        "保持全文检索索引为最新",
        "保持全文檢索索引為最新",
    ],
    "Process Files in the Background": ["在后台处理文件", "在背景處理檔案"],
    "Process files in the background": ["在后台处理文件", "在背景處理檔案"],
    "Process files ahead of time while your computer is idle for faster responses.":
        [
            "在电脑空闲时预先处理文件，加快回答。",
            "在電腦閒置時預先處理檔案，加快回覆。",
        ],
    "full-text search": ["全文检索", "全文檢索"],
    "AsterMargin reads new and changed files while your computer is idle. Required for {features}.":
        [
            "星笺会在电脑空闲时读取新增和有改动的文件。{features}需要此功能。",
            "星箋會在電腦閒置時讀取新增及變更的檔案。{features}需要此功能。",
        ],
    "{items} missing from metadata search": [
        "元数据检索索引缺少{items}",
        "詮釋資料檢索索引缺少{items}",
    ],
    "Metadata search index needs attention": [
        "元数据检索索引需要修复",
        "詮釋資料檢索索引需要修復",
    ],
    "The last index update failed: {detail}": [
        "上次更新索引失败：{detail}",
        "上次更新索引失敗：{detail}",
    ],
    "These items could not be added to the local index that powers searching by title and abstract.":
        [
            "这些条目无法添加到本机的标题与摘要索引。",
            "這些項目無法加入本機的標題與摘要索引。",
        ],
    "Rebuilding…": ["正在重建…", "正在重建…"],
    Rebuild: ["重建", "重建"],
    "Could not start processing.": ["无法开始处理。", "無法開始處理。"],
    "Could not retry these files.": [
        "无法重试这些文件。",
        "無法重試這些檔案。",
    ],
    "Could not update the list of problems. Previously reported problems are shown below.":
        [
            "无法更新问题列表。下方显示上次报告的问题。",
            "無法更新問題清單。下方顯示上次回報的問題。",
        ],
    "Checking files for problems…": [
        "正在检查文件是否有问题…",
        "正在檢查檔案是否有問題…",
    ],
    "Checking for problems…": ["正在检查问题…", "正在檢查問題…"],
    "Of the files AsterMargin has processed so far, {files} could not be read or indexed.":
        [
            "已处理的文件中，有{files}无法读取或建立索引。",
            "已處理的檔案中，有{files}無法讀取或建立索引。",
        ],
    "All files AsterMargin has processed so far were read. Metadata search needs attention.":
        [
            "已处理的文件均成功读取。元数据检索索引需要修复。",
            "已處理的檔案均成功讀取。詮釋資料檢索索引需要修復。",
        ],
    "No problems found in the files AsterMargin has processed so far.": [
        "目前已处理的文件未发现问题。",
        "目前已處理的檔案未發現問題。",
    ],
    Problems: ["问题", "問題"],
    "Report a file processing problem by email.": [
        "通过邮件报告文件处理问题。",
        "透過電子郵件回報檔案處理問題。",
    ],
    "AsterMargin just started. Processing begins shortly.": [
        "星笺刚启动，稍后开始处理。",
        "星箋剛啟動，稍後開始處理。",
    ],
    "Zotero is syncing.": ["Zotero 正在同步。", "Zotero 正在同步。"],
    "AsterMargin is reading a file you asked for.": [
        "星笺正在读取你请求的文件。",
        "星箋正在讀取你要求的檔案。",
    ],
    "Waiting for your AsterMargin account to load.": [
        "正在等待星笺账户加载。",
        "正在等待星箋帳號載入。",
    ],
    "Waiting for Zotero to be ready.": [
        "正在等待 Zotero 就绪。",
        "正在等待 Zotero 就緒。",
    ],
    "Checking status…": ["正在检查状态…", "正在檢查狀態…"],
    "Reading background activity.": [
        "正在读取后台任务状态。",
        "正在讀取背景工作狀態。",
    ],
    "Status unavailable": ["无法获取状态", "無法取得狀態"],
    "AsterMargin will try again in a few seconds.": [
        "星笺将在几秒后重试。",
        "星箋將在幾秒後重試。",
    ],
    "Finishing current file…": ["正在完成当前文件…", "正在完成目前的檔案…"],
    "{files} waiting.": ["有{files}正在等待。", "有{files}正在等待。"],
    "Processing continues when your computer is idle.": [
        "电脑空闲时将继续处理。",
        "電腦閒置時會繼續處理。",
    ],
    "Waiting for OCR…": ["正在等待 OCR…", "正在等待 OCR…"],
    "{files} processing remotely.": [
        "有{files}正在远程处理。",
        "有{files}正在遠端處理。",
    ],
    "Processing files…": ["正在处理文件…", "正在處理檔案…"],
    "Starting…": ["正在启动…", "正在啟動…"],
    "{files} remaining": ["剩余{files}", "剩餘{files}"],
    "Reading text from your files.": [
        "正在读取文件中的文本。",
        "正在讀取檔案中的文字。",
    ],
    "Checking for additional files…": [
        "正在检查其他文件…",
        "正在檢查其他檔案…",
    ],
    "AsterMargin is checking your libraries for files to process.": [
        "星笺正在文献库中查找待处理的文件。",
        "星箋正在文獻庫中尋找待處理的檔案。",
    ],
    "{files} waiting": ["有{files}正在等待", "有{files}正在等待"],
    "Waiting to start": ["等待开始", "等待開始"],
    "Starts after about 30 seconds without keyboard or mouse activity on your computer.":
        ["键盘和鼠标闲置约 30 秒后开始。", "鍵盤和滑鼠閒置約 30 秒後開始。"],
    "Full-text search is up to date": [
        "全文检索索引已更新",
        "全文檢索索引已更新",
    ],
    "Processing finished": ["处理完毕", "處理完畢"],
    "Some files are processing remotely or waiting to retry.": [
        "部分文件正在远程处理或等待重试。",
        "部分檔案正在遠端處理或等待重試。",
    ],
    "AsterMargin picks up unfinished files automatically.": [
        "星笺会自动继续处理尚未完成的文件。",
        "星箋會自動繼續處理尚未完成的檔案。",
    ],
    "No files to process yet. AsterMargin checks your libraries for new files automatically.":
        [
            "暂无待处理文件。星笺会自动检查文献库中是否有新文件。",
            "目前沒有待處理檔案。星箋會自動檢查文獻庫中是否有新檔案。",
        ],
    "AsterMargin processes new and changed files automatically.": [
        "星笺会自动处理新增和有改动的文件。",
        "星箋會自動處理新增及變更的檔案。",
    ],
    "{count} file": [" {count} 个文件", " {count} 個檔案"],
    "{count} files": [" {count} 个文件", " {count} 個檔案"],
    "{count} attachment": [" {count} 个附件", " {count} 個附件"],
    "{count} attachments": [" {count} 个附件", " {count} 個附件"],
    "{count} item": [" {count} 个条目", " {count} 個項目"],
    "{count} items": [" {count} 个条目", " {count} 個項目"],
    "Scanned files without a text layer": [
        "无文本层的扫描文件",
        "無文字層的掃描檔案",
    ],
    "These files contain only images of text.": [
        "这些文件中的文字是图像。",
        "這些檔案中的文字是影像。",
    ],
    "OCR can turn scans into readable, searchable text. It will be included with eligible plans.":
        [
            "OCR 可以将扫描件转换为可读、可检索的文本。适用方案将提供这项功能。",
            "OCR 可將掃描檔轉換為可閱讀、可檢索的文字。適用方案會提供此功能。",
        ],
    "No readable text": ["无可读文本", "無可讀文字"],
    "The file did not yield any readable text. Retry after replacing the file.":
        [
            "未能从文件中提取可读文本。请替换文件后重试。",
            "無法從檔案擷取可讀文字。請更換檔案後重試。",
        ],
    "File not available": ["文件不可用", "檔案無法存取"],
    "The attachment is missing on this computer or could not be downloaded. Retry after restoring the file.":
        [
            "本机缺少该附件，或无法下载。请恢复文件后重试。",
            "本機缺少此附件，或無法下載。請還原檔案後重試。",
        ],
    "No permission to read": ["没有读取权限", "沒有讀取權限"],
    "Zotero is not allowed to read these files. Grant Zotero access to their folders in System Settings → Privacy & Security → Files and Folders or Full Disk Access, restart Zotero if asked, then retry.":
        [
            "Zotero 无权读取这些文件。请在“系统设置 → 隐私与安全性 → 文件与文件夹”或“完全磁盘访问权限”中授权。如有提示，请重启 Zotero 后重试。",
            "Zotero 無權讀取這些檔案。請在「系統設定 → 隱私權與安全性 → 檔案與資料夾」或「完整磁碟存取權限」中授權。如有提示，請重新啟動 Zotero 後重試。",
        ],
    "Zotero could not open these files. Check that your user account can read them and that no other program has them locked, then retry.":
        [
            "Zotero 无法打开这些文件。请确认当前账户具有读取权限，且文件未被其他程序锁定，再重试。",
            "Zotero 無法開啟這些檔案。請確認目前的帳號有讀取權限，且檔案未被其他程式鎖定，再重試。",
        ],
    "Password protected": ["受密码保护", "受密碼保護"],
    "Encrypted files cannot be read. Retry after replacing the file with an unprotected copy.":
        [
            "无法读取加密文件。请换成无密码保护的副本后重试。",
            "無法讀取加密檔案。請換成未受密碼保護的副本後重試。",
        ],
    "Too large to process": ["超出文件处理限制", "超出檔案處理限制"],
    "These files exceed the {pages}-page or {size} MB limit. Retry after replacing the file or changing the limit.":
        [
            "这些文件超过 {pages} 页或 {size} MB 的限制。请更换文件或调整限制后重试。",
            "這些檔案超過 {pages} 頁或 {size} MB 的限制。請更換檔案或調整限制後重試。",
        ],
    "Unsupported file type": ["不支持的文件类型", "不支援的檔案類型"],
    "AsterMargin reads PDFs, EPUBs and web snapshots.": [
        "星笺可以读取 PDF、EPUB 和网页快照。",
        "星箋可以讀取 PDF、EPUB 和網頁快照。",
    ],
    "OCR failed": ["OCR 识别失败", "OCR 辨識失敗"],
    "Text recognition did not succeed for these scans.": [
        "未能识别这些扫描件中的文字。",
        "無法辨識這些掃描檔中的文字。",
    ],
    "OCR temporarily unavailable": ["OCR 暂不可用", "OCR 暫時無法使用"],
    "Cloud text recognition is not accepting work right now. AsterMargin will retry automatically, or you can retry now.":
        [
            "云端文字识别目前无法接收任务。星笺会自动重试，你也可以立即重试。",
            "雲端文字辨識目前無法接受工作。星箋會自動重試，你也可以立即重試。",
        ],
    "Exceeds the OCR page limit": ["超出 OCR 页数限制", "超出 OCR 頁數限制"],
    "These scans exceed the 500-page OCR limit and will not be retried automatically. Retry after the limit or source changes.":
        [
            "这些扫描件超过 OCR 的 500 页限制。请调整限制或更换文件后手动重试。",
            "這些掃描檔超過 OCR 的 500 頁限制。請調整限制或更換檔案後手動重試。",
        ],
    "Not added to the search index": ["未添加到检索索引", "未加入檢索索引"],
    "These files were read but could not be uploaded to the cloud search index.":
        [
            "文件读取成功，但未能上传到云端检索索引。",
            "檔案已讀取，但無法上傳至雲端檢索索引。",
        ],
    "Could not extract text": ["无法提取文本", "無法擷取文字"],
    "AsterMargin ran into an error while reading these files.": [
        "星笺读取这些文件时遇到错误。",
        "星箋讀取這些檔案時發生錯誤。",
    ],
    "Could not load files. AsterMargin will try again shortly.": [
        "无法加载文件。星笺稍后会重试。",
        "無法載入檔案。星箋稍後會重試。",
    ],
    "Loading…": ["正在加载…", "正在載入…"],
    Retry: ["重试", "重試"],
    "Retry {file}": ["重试“{file}”", "重試「{file}」"],
    "Coming soon": ["即将推出", "即將推出"],
    "Retry all": ["全部重试", "全部重試"],
    "Retry all: {group}": ["重试全部“{group}”", "重試全部「{group}」"],
    "Previous page": ["上一页", "上一頁"],
    "Next page": ["下一页", "下一頁"],
    "Local Document Cache": ["本机文档缓存", "本機文件快取"],
    "Text AsterMargin has read from your attachments, kept so it can respond faster.":
        [
            "缓存从附件中提取的文本，加快回答。",
            "快取從附件擷取的文字，加快回覆。",
        ],
    "Checking local storage…": ["正在检查本机存储…", "正在檢查本機儲存空間…"],
    "Cache status unavailable": ["无法获取缓存状态", "無法取得快取狀態"],
    "Clear…": ["清除…", "清除…"],
    "Clear Local Document Cache?": ["清除本机文档缓存？", "清除本機文件快取？"],
    "Clear extracted text from {files}?": [
        "清除从{files}提取的文本吗？",
        "要清除從{files}擷取的文字嗎？",
    ],
    "Your original files are not affected. AsterMargin reads a file again the next time it is needed.":
        [
            "原始文件会保留。星笺会在下次需要时重新读取。",
            "原始檔案會保留。星箋會在下次需要時重新讀取。",
        ],
    "Prepared OCR text is retained, including after cloud access ends.": [
        "OCR 识别得到的文本会保留。云端访问结束后仍可使用。",
        "OCR 辨識所得文字會保留。雲端存取結束後仍可使用。",
    ],
    "Your full-text search index is not affected.": [
        "全文检索索引会保留。",
        "全文檢索索引會保留。",
    ],
    "Could not clear the local cache.": [
        "无法清除本机缓存。",
        "無法清除本機快取。",
    ],
    "{count} prepared scan needs re-preparation after an extraction update. Its cached data is retained and will not be served until compatible preparation is available.":
        [
            "提取功能更新后，有 {count} 个扫描件需要重新处理。缓存会保留，待兼容的处理功能可用后才能读取。",
            "擷取功能更新後，有 {count} 個掃描檔需要重新處理。快取會保留，待相容的處理功能可用後才能讀取。",
        ],
    "{count} prepared scans need re-preparation after an extraction update. Their cached data is retained and will not be served until compatible preparation is available.":
        [
            "提取功能更新后，有 {count} 个扫描件需要重新处理。缓存会保留，待兼容的处理功能可用后才能读取。",
            "擷取功能更新後，有 {count} 個掃描檔需要重新處理。快取會保留，待相容的處理功能可用後才能讀取。",
        ],
    "Cache cleared. Prepared OCR text is retained. Other files will be read again when needed. To prepare them ahead of time, enable Background Processing and use Rebuild cache under Cached text once pending processing has finished.":
        [
            "缓存已清除，OCR 文本已保留。其他文件将在用到时重新读取。若想预先处理，请启用后台处理，等当前任务结束后，在“已缓存的文本”下选择“重建缓存”。",
            "快取已清除，OCR 文字已保留。其他檔案會在用到時重新讀取。若要預先處理，請啟用背景處理，等目前工作結束後，在「已快取的文字」下選擇「重建快取」。",
        ],
    "Rebuild Search Index": ["重建检索索引", "重建檢索索引"],
    "Check that the local index used to search by title and abstract matches your Zotero libraries. This happens automatically; run it by hand if search results look out of date.":
        [
            "检查本机的标题与摘要索引是否与 Zotero 文献库一致。检查通常自动运行，也可在检索结果过时时手动运行。",
            "檢查本機的標題與摘要索引是否與 Zotero 文獻庫一致。檢查通常自動執行，也可在檢索結果過時時手動執行。",
        ],
    "{count} items failed to index": [
        "有 {count} 个条目未能建立索引",
        "有 {count} 個項目無法建立索引",
    ],
    "Error:": ["错误：", "錯誤："],
    "Indexing{progress}": ["正在建立索引{progress}", "正在建立索引{progress}"],
    Actions: ["动作", "動作"],
    Import: ["导入", "匯入"],
    "Import an action from a .astermarginaction file": [
        "从 .astermarginaction 文件导入动作",
        "從 .astermarginaction 檔案匯入動作",
    ],
    "Add Action": ["添加动作", "新增動作"],
    "Actions are reusable prompts for common research tasks. They appear based on what you're doing in Zotero: on the AsterMargin homepage, in the slash menu, and Zotero's right-click menu. Each action targets items, collections, or your whole library, and AsterMargin shows the relevant ones automatically.":
        [
            "动作是用于常见研究任务的可复用提示词。星笺会根据你在 Zotero 中选中的条目、分类或文献库，在首页、斜杠菜单和 Zotero 右键菜单中显示相关动作。",
            "動作是用於常見研究工作的可重複使用提示詞。星箋會依照你在 Zotero 中選取的項目、分類或文獻庫，在首頁、斜線選單和 Zotero 右鍵選單中顯示相關動作。",
        ],
    "Filter by target": ["按适用范围筛选", "依適用範圍篩選"],
    "Filter by category": ["按动作类别筛选", "依動作類別篩選"],
    "All targets": ["全部适用范围", "所有適用範圍"],
    "All categories": ["全部类别", "所有類別"],
    "Show:": ["显示：", "顯示："],
    Clear: ["清除", "清除"],
    "No actions match the selected filters.": [
        "没有符合筛选条件的动作。",
        "沒有符合篩選條件的動作。",
    ],
    "Deleted actions ({count})": [
        "已删除的动作（{count}）",
        "已刪除的動作（{count}）",
    ],
    Restore: ["恢复", "還原"],
    "Import failed": ["导入失败", "匯入失敗"],
    "Action imported": ["动作已导入", "動作已匯入"],
    "A /{original} command already existed, so this one was added as /{command}.":
        [
            "命令 /{original} 已存在，导入的命令已改为 /{command}。",
            "命令 /{original} 已存在，匯入的命令已改為 /{command}。",
        ],
    "Could not import the action.": ["无法导入该动作。", "無法匯入此動作。"],
    Required: ["必填", "必填"],
    "Action exported": ["动作已导出", "動作已匯出"],
    'Saved "{title}" to a file. Share it and others can import it into AsterMargin.':
        [
            "已将“{title}”保存到文件。其他人可以将该文件导入星笺。",
            "已將「{title}」儲存至檔案。其他人可以將此檔案匯入星箋。",
        ],
    "Export failed": ["导出失败", "匯出失敗"],
    "Could not save the action to a file.": [
        "无法将动作保存到文件。",
        "無法將動作儲存至檔案。",
    ],
    "Untitled action": ["未命名动作", "未命名動作"],
    Placeholders: ["占位符", "預留位置"],
    "New action": ["新建动作", "新增動作"],
    Locked: ["已锁定", "已鎖定"],
    Cancel: ["取消", "取消"],
    "Add a title and a prompt to save": [
        "填写标题和提示词后即可保存",
        "填寫標題和提示詞後即可儲存",
    ],
    Save: ["保存", "儲存"],
    Title: ["标题", "標題"],
    "Action title...": ["动作标题…", "動作標題…"],
    "Action title": ["动作标题", "動作標題"],
    Description: ["说明", "說明"],
    "Short summary shown when you hover the /command in the chat. Optional.": [
        "可选。鼠标悬停在对话中的 /命令 上时显示的简要说明。",
        "選填。滑鼠停留在對話中的 /命令 上時顯示的簡短說明。",
    ],
    "e.g. Summarize the key findings of the selected paper": [
        "例如，概括所选论文的主要发现",
        "例如，摘要所選論文的主要發現",
    ],
    "Action description": ["动作说明", "動作說明"],
    "Slash command": ["斜杠命令", "斜線命令"],
    "Typing /command in the chat input inserts this action. Derived from the title unless you set it yourself; spaces are not allowed.":
        [
            "在对话输入框中输入 /命令，即可插入该动作。不设命令时会从标题生成。命令不能含空格。",
            "在對話輸入框輸入 /命令，即可插入此動作。若未設定命令，會由標題產生。命令不可含空格。",
        ],
    "Slash command name": ["斜杠命令名称", "斜線命令名稱"],
    "Already used. A number will be added.": [
        "该名称已被使用，将添加数字后缀。",
        "名稱已被使用，將加上數字尾碼。",
    ],
    "Derived from the title. Edit to set your own.": [
        "由标题生成，也可直接编辑。",
        "由標題產生，也可直接編輯。",
    ],
    "Clear the field to derive it from the title again.": [
        "清空后将重新从标题生成命令。",
        "清空後會重新由標題產生命令。",
    ],
    "Argument hint": ["参数提示", "參數提示"],
    "Hint shown during autocomplete to indicate expected arguments.": [
        "在自动补全时提示需要输入的参数。",
        "自動完成時提示須輸入的參數。",
    ],
    "e.g. topic or question": ["例如，主题或问题", "例如，主題或問題"],
    "Shown greyed out after the inserted command.": [
        "插入命令后，提示以灰色显示在命令后方。",
        "插入命令後，提示會以灰色顯示在命令後方。",
    ],
    Prompt: ["提示词", "提示詞"],
    "Enter prompt text...": ["输入提示词…", "輸入提示詞…"],
    "Action prompt text": ["动作提示词", "動作提示詞"],
    "{count} characters": ["{count} 个字符", "{count} 個字元"],
    "This prompt contains [[ ]] placeholders. They are currently sent to the assistant as written; a new way to fill them in is coming in a future update.":
        [
            "此提示词含有 [[ ]] 占位符。目前会将其原样发送给助手，后续版本将支持填写占位符。",
            "此提示詞含有 [[ ]] 預留位置。目前會原樣傳送給助理，後續版本將支援填寫。",
        ],
    Category: ["类别", "類別"],
    "Groups this action on the AsterMargin homepage launcher.": [
        "用于在星笺首页对动作分组。",
        "用於在星箋首頁將動作分組。",
    ],
    "Select category": ["选择类别", "選擇類別"],
    "Applies to": ["适用范围", "適用範圍"],
    "Controls when this action shows up, based on your current Zotero selection.":
        [
            "根据 Zotero 中当前选中的内容，决定何时显示此动作。",
            "依照 Zotero 中目前選取的內容，決定何時顯示此動作。",
        ],
    "Select what this action applies to": [
        "选择动作适用的范围",
        "選擇動作適用的範圍",
    ],
    "Add a title and a prompt to export": [
        "填写标题和提示词后即可导出",
        "填寫標題和提示詞後即可匯出",
    ],
    "Save this action to a file you can share": [
        "将此动作保存为可共享的文件",
        "將此動作儲存為可分享的檔案",
    ],
    Export: ["导出", "匯出"],
    "Create an editable copy of this action": [
        "为此动作创建可编辑的副本",
        "為此動作建立可編輯的副本",
    ],
    "Reset to default": ["恢复默认设置", "還原預設設定"],
    "Custom Instructions": ["自定义指令", "自訂指令"],
    "Custom instructions are added to all chats and help steer responses. (Max ~250 words)":
        [
            "所有对话都会附加这些指令，引导助手回答。建议不超过约 250 词。",
            "所有對話都會附加這些指令，引導助理回覆。建議不超過約 250 詞。",
        ],
    "Enter custom instructions here...": ["输入自定义指令…", "輸入自訂指令…"],
    "Custom instructions": ["自定义指令", "自訂指令"],
    "Reader Explain Prompt": ["阅读器的解释提示词", "閱讀器的解釋提示詞"],
    'The prompt sent when you click "Explain" on selected text or annotations in the PDF reader.':
        [
            "在 PDF 阅读器中选中文本或批注并点击“解释”时发送此提示词。",
            "在 PDF 閱讀器中選取文字或註解並點選「解釋」時傳送此提示詞。",
        ],
    "Explain the selected passage from this paper in plain language...": [
        "用通俗语言解释论文中选中的段落…",
        "用淺白的文字解釋論文中選取的段落…",
    ],
    "Reader explain prompt": ["阅读器的解释提示词", "閱讀器的解釋提示詞"],
    Close: ["关闭", "關閉"],
    Enable: ["启用", "啟用"],
    Stop: ["停止", "停止"],
    "Test Endpoint": ["测试端点", "測試端點"],
    "Test endpoint": ["测试端点", "測試端點"],
    "Local Mode": ["本机模式", "本機模式"],
    Copy: ["复制", "複製"],
    "This prompt contains [[ ]] placeholders, which are sent as written.": [
        "此提示词含有 [[ ]] 占位符，发送时将保留原样。",
        "此提示詞含有 [[ ]] 預留位置，傳送時會保留原樣。",
    ],
    "This action is managed by AsterMargin and can't be edited. Duplicate it to make an editable copy.":
        [
            "这是星笺管理的内置动作。若要编辑，请创建副本。",
            "這是星箋管理的內建動作。若要編輯，請建立副本。",
        ],
    Items: ["条目", "項目"],
    Item: ["条目", "項目"],
    Attachment: ["附件", "附件"],
    Note: ["笔记", "筆記"],
    Collection: ["分类", "分類"],
    Anywhere: ["任意位置", "任何位置"],
    "Item or attachment": ["条目或附件", "項目或附件"],
    Research: ["研究", "研究"],
    Write: ["写作", "寫作"],
    Organize: ["整理", "整理"],
    Uncategorized: ["未分类", "未分類"],
    "Works anywhere, no context needed": [
        "可在任意位置使用，无需选中内容",
        "可在任何位置使用，無須選取內容",
    ],
    "Works with library items": ["适用于文献库条目", "適用於文獻庫項目"],
    "Works with PDF, EPUB, and snapshot attachments": [
        "适用于 PDF、EPUB 和网页快照附件",
        "適用於 PDF、EPUB 和網頁快照附件",
    ],
    "Works with library items and file attachments": [
        "适用于文献库条目和附件",
        "適用於文獻庫項目和附件",
    ],
    "Works with Zotero notes": ["适用于 Zotero 笔记", "適用於 Zotero 筆記"],
    "Works with collections": ["适用于分类", "適用於分類"],
    About: ["关于", "關於"],
    "AsterMargin": ["星笺", "星箋"],
    "Version {version}": ["版本 {version}", "版本 {version}"],
    "AI-assisted literature reading for Zotero, with local-first research tools.": [
        "面向 Zotero 的 AI 辅助文献阅读工具，优先使用本机研究能力。",
        "面向 Zotero 的 AI 輔助文獻閱讀工具，優先使用本機研究能力。",
    ],
    "License and attribution": ["许可证与署名", "授權條款與署名"],
    "AsterMargin is released under AGPL-3.0-or-later and includes attribution for Beaver and other third-party components.": [
        "星笺采用 AGPL-3.0 或更高版本许可，并保留 Beaver 及其他第三方组件的署名。",
        "星箋採用 AGPL-3.0 或更新版本授權，並保留 Beaver 及其他第三方元件的署名。",
    ],
    "Source code": ["源代码", "原始碼"],
    "Data handling": ["数据处理", "資料處理"],
    "Local indexes, OCR results and conversation state stay on this device. Remote models receive only the material needed for the current task and selected library scope.": [
        "本机索引、OCR 结果和对话状态保留在此设备。远程模型只会收到当前任务和获准文献库所需的材料。",
        "本機索引、OCR 結果和對話狀態保留在此裝置。遠端模型只會收到目前工作和獲准文獻庫所需的資料。",
    ],
    "Provider templates": ["供应商模板", "供應商範本"],
    "Choose a provider to prefill its endpoint and protocol. Enter the endpoint and API key in the card, then load the models offered by that endpoint.": [
        "选择供应商以预填端点和协议。在卡片中填写端点与 API 密钥，然后加载该端点提供的模型。",
        "選擇供應商以預填端點和協定。在卡片中填寫端點與 API 金鑰，然後載入該端點提供的模型。",
    ],
    "Start with a known endpoint, then choose a model and enter its key. Local templates keep requests on this device.": [
        "从常用端点开始，选择模型并填写密钥。本机模板会让请求留在此设备。",
        "從常用端點開始，選擇模型並填寫金鑰。本機範本會讓請求留在此裝置。",
    ],
    "Provider template": ["供应商模板", "供應商範本"],
    "Use endpoint template": ["使用端点模板", "使用端點範本"],
    "Load models from endpoint": ["从端点加载模型", "從端點載入模型"],
    "Enter the endpoint and API key first. AsterMargin then reads the current model list and capabilities.": [
        "请先填写端点和 API 密钥。星笺随后会读取该端点当前的模型列表和能力信息。",
        "請先填寫端點與 API 金鑰。星箋接著會讀取該端點目前的模型清單與能力資訊。",
    ],
    "{count} models loaded": ["已加载 {count} 个模型", "已載入 {count} 個模型"],
    "No models were returned. You can enter a model ID manually.": [
        "端点没有返回模型，可手动输入模型 ID。",
        "端點未傳回模型，可手動輸入模型 ID。",
    ],
    "Model discovery timed out. Try again or enter a model ID manually.": [
        "加载模型超时，请重试或手动输入模型 ID。",
        "載入模型逾時，請重試或手動輸入模型 ID。",
    ],
    "Could not load models from the endpoint.": [
        "无法从端点加载模型。",
        "無法從端點載入模型。",
    ],
    "Enter a model ID manually": ["手动输入模型 ID", "手動輸入模型 ID"],
    "The endpoint lists these reasoning levels: {levels}": [
        "端点列出的推理强度为 {levels}",
        "端點列出的推理強度為 {levels}",
    ],
    "The endpoint did not return a model list.": [
        "端点未返回模型列表。",
        "端點未傳回模型清單。",
    ],
    "Model loading failed ({status}).": ["模型加载失败（{status}）。", "模型載入失敗（{status}）。"],
    "Template model": ["模板模型", "範本模型"],
    "Use template": ["使用模板", "使用範本"],
    "OpenAI API. Enter the endpoint and key, then load the models offered by your account.": ["OpenAI API。填写端点和密钥后，加载账户可用的模型。", "OpenAI API。填寫端點與金鑰後，載入帳戶可用的模型。"],
    "Anthropic Messages API. Enter the endpoint and key, then load the models offered by your account.": ["Anthropic Messages API。填写端点和密钥后，加载账户可用的模型。", "Anthropic Messages API。填寫端點與金鑰後，載入帳戶可用的模型。"],
    "Gemini OpenAI-compatible API. Enter the endpoint and key, then load the models offered by your account.": ["Gemini OpenAI 兼容 API。填写端点和密钥后，加载账户可用的模型。", "Gemini OpenAI 相容 API。填寫端點與金鑰後，載入帳戶可用的模型。"],
    "DeepSeek OpenAI-compatible API. Enter the endpoint and key, then load the models offered by your account.": ["DeepSeek OpenAI 兼容 API。填写端点和密钥后，加载账户可用的模型。", "DeepSeek OpenAI 相容 API。填寫端點與金鑰後，載入帳戶可用的模型。"],
    "Qwen DashScope compatible-mode API. Enter the endpoint and key, then load the models offered by your account.": ["通义千问百炼兼容模式 API。填写端点和密钥后，加载账户可用的模型。", "通義千問百煉相容模式 API。填寫端點與金鑰後，載入帳戶可用的模型。"],
    "OpenRouter API. Enter the endpoint and key, then load the models available to your account.": ["OpenRouter API。填写端点和密钥后，加载账户可用的模型。", "OpenRouter API。填寫端點與金鑰後，載入帳戶可用的模型。"],
    "Ollama local API. Enter the endpoint, optionally enter a key, then load installed models.": ["Ollama 本机 API。填写端点，可选填密钥，然后加载已安装的模型。", "Ollama 本機 API。填寫端點，可選填金鑰，然後載入已安裝的模型。"],
    "LM Studio local OpenAI-compatible API. Enter the endpoint, optionally enter a key, then load available models.": ["LM Studio 本机 OpenAI 兼容 API。填写端点，可选填密钥，然后加载已载入的模型。", "LM Studio 本機 OpenAI 相容 API。填寫端點，可選填金鑰，然後載入已載入的模型。"],
    "Reasoning strength": ["推理强度", "推理強度"],
    "Service default": ["服务端默认", "服務端預設"],
    Low: ["低", "低"],
    Medium: ["中", "中"],
    High: ["高", "高"],
    "Leave this at service default unless the endpoint documents a supported level. The server decides the effective setting.": [
        "除非端点文档明确支持某档位，否则保持服务端默认。实际采用的档位由服务端决定。",
        "除非端點文件明確支援某檔位，否則保持服務端預設。實際採用的檔位由服務端決定。",
    ],
    "Endpoint accepted the request.": ["端点已接受请求", "端點已接受請求"],
    Search: ["检索", "搜尋"],
    "Physics literature search": ["物理文献检索", "物理文獻檢索"],
    "List models": ["列出模型", "列出模型"],
    "Discovered models": ["已发现模型", "已發現模型"],
    "Choose a discovered model": ["选择已发现的模型", "選擇已發現的模型"],
    "Search arXiv and NASA ADS": ["检索 arXiv 和 NASA ADS", "搜尋 arXiv 和 NASA ADS"],
    "NASA ADS API key": ["NASA ADS API 密钥", "NASA ADS API 金鑰"],
    "Optional. NASA ADS searches use this key and stay scoped to the current query.": [
        "可选。NASA ADS 检索使用此密钥，并仅发送当前查询。",
        "選填。NASA ADS 搜尋使用此金鑰，並只傳送目前查詢。",
    ],
    "Preview import": ["预览导入", "預覽匯入"],
    "Import preview": ["导入预览", "匯入預覽"],
    "Update original item": ["更新原条目", "更新原項目"],
    "Import into My Library": ["导入个人文献库", "匯入個人文獻庫"],
    "Confirm and write": ["确认并写入", "確認並寫入"],
    "Updated the original Zotero item. The preprint attachment and annotations were kept.": [
        "已更新原 Zotero 条目，预印本附件和批注均已保留。",
        "已更新原 Zotero 項目，預印本附件和註解均已保留。",
    ],
    "Imported the paper into My Library. The PDF will be added when available.": [
        "论文已导入个人文献库，PDF 可在取得后补入。",
        "論文已匯入個人文獻庫，PDF 可在取得後補入。",
    ],
    "The existing preprint attachment and annotations remain. A journal PDF can be added later without creating a duplicate item.": [
        "现有预印本附件和批注会保留，之后可补入期刊 PDF，不会创建重复条目。",
        "現有預印本附件和註解會保留，之後可補入期刊 PDF，不會建立重複項目。",
    ],
    "Evaluation candidates: {models}. Compare top-five retrieval, cross-language queries, latency and memory before changing the local default.": [
        "评估候选：{models}。在更改本机默认模型前，比较前五项命中率、跨语言检索、延迟和内存。",
        "評估候選：{models}。在變更本機預設模型前，比較前五項命中率、跨語言搜尋、延遲和記憶體。",
    ],
    "Cloud OCR evaluation": ["云端 OCR 评估", "雲端 OCR 評估"],
    "Only pages you select are rendered and sent. This comparison does not change the local OCR engine.": [
        "只会渲染并发送你选中的页面，本次比较不会改变本机 OCR 引擎。",
        "只會轉換並傳送你選取的頁面，本次比較不會變更本機 OCR 引擎。",
    ],
    "Selected pages": ["选中页面", "選取頁面"],
    "Cloud OCR endpoint": ["云端 OCR 端点", "雲端 OCR 端點"],
    "Cloud OCR API key": ["云端 OCR API 密钥", "雲端 OCR API 金鑰"],
    "Save evaluation settings": ["保存评估设置", "儲存評估設定"],
    "Saved selected pages: {pages}": ["已保存选中页面：{pages}", "已儲存選取頁面：{pages}"],
    none: ["无", "無"],
    "Enable literature and table tools": ["启用文献与表格工具", "啟用文獻與表格工具"],
    "Advertise arXiv and NASA ADS search, research-table reads and table edit proposals. Proposals never write without a Zotero confirmation.": [
        "提供 arXiv、NASA ADS 检索、研究表格读取和编辑提案。提案必须在 Zotero 中确认后才会写入。",
        "提供 arXiv、NASA ADS 搜尋、研究表格讀取和編輯提案。提案必須在 Zotero 中確認後才會寫入。",
    ],
    "An endpoint URL is required for custom providers.": [
        "自定义模型服务必须填写端点地址。",
        "自訂模型服務必須填寫端點位址。",
    ],
    "Enter a valid URL, for example http://localhost:11434/v1.": [
        "请输入有效的 URL，例如 http://localhost:11434/v1。",
        "請輸入有效的 URL，例如 http://localhost:11434/v1。",
    ],
    "Enter a valid URL, for example https://api.example.com/v1.": [
        "请输入有效的 URL，例如 https://api.example.com/v1。",
        "請輸入有效的 URL，例如 https://api.example.com/v1。",
    ],
    "The endpoint must use http or https.": [
        "端点必须使用 HTTP 或 HTTPS。",
        "端點必須使用 HTTP 或 HTTPS。",
    ],
    "The endpoint must use HTTPS. Plain HTTP endpoints are blocked.": [
        "端点必须使用 HTTPS，不能使用未加密的 HTTP。",
        "端點必須使用 HTTPS，無法使用未加密的 HTTP。",
    ],
    "The endpoint cannot point to localhost. It must be reachable from the public internet.":
        [
            "端点不能指向 localhost，必须可通过公网访问。",
            "端點不可指向 localhost，必須可透過公開網路存取。",
        ],
    "The endpoint cannot use a private, internal, or reserved IP address. It must be reachable from the public internet.":
        [
            "端点不能使用专用、内部或保留 IP 地址，必须可通过公网访问。",
            "端點不可使用私用、內部或保留的 IP 位址，必須可透過公開網路存取。",
        ],
    "This URL points to the Responses API. To use it, set Format to 'OpenAI Responses'.":
        [
            "此地址指向 Responses API。请选择“OpenAI Responses”协议格式。",
            "此位址指向 Responses API。請選擇「OpenAI Responses」協定格式。",
        ],
    "This URL points to the Chat Completions API. To use it, set Format to 'OpenAI Chat Completions'.":
        [
            "此地址指向 Chat Completions API。请选择“OpenAI Chat Completions”协议格式。",
            "此位址指向 Chat Completions API。請選擇「OpenAI Chat Completions」協定格式。",
        ],
    "This endpoint uses plain http, so your API key and library text travel unencrypted. Use https unless the server is on a network you trust.":
        [
            "此端点使用未加密的 HTTP，API 密钥和文献内容会以明文传输。除非你信任该服务器所在的网络，否则请使用 HTTPS。",
            "此端點使用未加密的 HTTP，API 金鑰和文獻內容會以明文傳輸。除非你信任該伺服器所在的網路，否則請使用 HTTPS。",
        ],
    "Choose a model in AsterMargin Preferences → API Keys before starting a chat.":
        [
            "请先在“星笺设置 → API 密钥”中添加并选择模型。",
            "請先在「星箋設定 → API 金鑰」中新增並選擇模型。",
        ],
    "Add an API key for the selected model in AsterMargin Preferences → API Keys.":
        [
            "请在“星笺设置 → API 密钥”中为所选模型配置密钥。",
            "請在「星箋設定 → API 金鑰」中為選取的模型設定金鑰。",
        ],
    "Choose a supported API format for the selected model.": [
        "请为所选模型选择受支持的 API 格式。",
        "請為選取的模型選擇支援的 API 格式。",
    ],
    "Enter a valid endpoint URL for the selected model.": [
        "请为所选模型填写有效的端点地址。",
        "請為選取的模型填寫有效的端點位址。",
    ],
    "The endpoint responded.": ["已收到端点响应。", "已收到端點回應。"],
    "The request timed out. Check the endpoint URL and that the server is running.":
        [
            "请求超时。请检查端点地址并确认服务正在运行。",
            "請求逾時。請檢查端點位址並確認服務正在執行。",
        ],
    Streaming: ["流式输出", "串流輸出"],
    "Tool calling": ["工具调用", "工具呼叫"],
    Vision: ["图像输入", "影像輸入"],
    "Capability test results": ["能力测试结果", "能力測試結果"],
    "Technical details": ["技术详情", "技術詳細資料"],
    "Could not prepare OCR language data.": [
        "无法准备 OCR 语言文件。",
        "無法準備 OCR 語言檔案。",
    ],
    "Semantic search operation failed.": [
        "语义检索操作失败。",
        "語意檢索操作失敗。",
    ],
    "WebDAV sync failed.": ["无法同步 WebDAV 数据。", "無法同步 WebDAV 資料。"],
    "Scanned PDF OCR": ["扫描件 OCR", "掃描文件 OCR"],
    "Download and enable": ["下载并启用", "下載並啟用"],
    "Import language file": ["导入语言文件", "匯入語言檔"],
    Disable: ["停用", "停用"],
    "Enabled: {language}": ["已启用：{language}", "已啟用：{language}"],
    "Full-text semantic search": ["全文语义检索", "全文語意檢索"],
    "Download model": ["下载模型", "下載模型"],
    "Import from folder": ["从文件夹导入", "從資料夾匯入"],
    "Build or refresh index": ["建立或更新索引", "建立或更新索引"],
    "Indexed: {indexed} · Failed: {failed}": [
        "已建立索引：{indexed} · 失败：{failed}",
        "已建立索引：{indexed} · 失敗：{failed}",
    ],
    "Embedding model installed: {model}": [
        "已安装嵌入模型：{model}",
        "已安裝嵌入模型：{model}",
    ],
    "Research sync": ["研究数据同步", "研究資料同步"],
    "WebDAV folder URL": ["WebDAV 文件夹地址", "WebDAV 資料夾位址"],
    Username: ["用户名", "使用者名稱"],
    Password: ["密码", "密碼"],
    Chats: ["对话", "對話"],
    "Saved actions": ["已保存的动作", "已儲存的動作"],
    "Research tables": ["研究表格", "研究表格"],
    Sync: ["同步", "同步"],
    Synced: ["同步完成", "同步完成"],
    "Choose a revision to resolve the conflict": [
        "选择要保留的修订版本",
        "選擇要保留的修訂版本",
    ],
    "Use revision": ["使用此版本", "使用此版本"],
    "Automatic reading notes": ["新文献自动笔记", "新文獻自動筆記"],
    Off: ["关闭", "關閉"],
    "When a paper is added, send its title and abstract to the selected model and save the chosen action’s result as a child note.":
        [
            "添加论文时将标题和摘要发送给所选模型，并将动作结果保存为子笔记。",
            "新增論文時會將標題和摘要傳送給選取的模型，並將動作結果儲存為子筆記。",
        ],
    "AsterMargin Settings": ["星笺设置", "星箋設定"],
    "No active plan": ["没有有效方案", "沒有有效方案"],
    "{plan} plan": ["{plan} 方案", "{plan} 方案"],
    "{email} — open Plan & Usage": [
        "{email} · 打开方案与用量",
        "{email} · 開啟方案與用量",
    ],
    "Account {email}, {plan}. Open Plan & Usage": [
        "账户 {email}，{plan}。打开方案与用量",
        "帳號 {email}，{plan}。開啟方案與用量",
    ],
    "Show files: {reason}": ["显示文件：{reason}", "顯示檔案：{reason}"],
    "Hide files: {reason}": ["隐藏文件：{reason}", "隱藏檔案：{reason}"],
    "{count} document": [" {count} 份文档", " {count} 份文件"],
    "{count} documents": [" {count} 份文档", " {count} 份文件"],
    "{files} · {size}": ["{files} · {size}", "{files} · {size}"],
    "{items}": ["{items}", "{items}"],
    "{a} or {b}": ["{a}或{b}", "{a}或{b}"],
    "{a} and {b}": ["{a}与{b}", "{a}與{b}"],
    "{title} (copy)": ["{title}（副本）", "{title}（副本）"],
    "Artificial Analysis Intelligence Index": [
        "Artificial Analysis 智能指数",
        "Artificial Analysis 智慧指數",
    ],
    "No files": ["没有文件", "沒有檔案"],
    Closed: ["已关闭", "已關閉"],
    "{items}, {attachments}": [
        "{items}，{attachments}",
        "{items}，{attachments}",
    ],
    "{count} unchecked": ["{count} 个未勾选", "{count} 個未勾選"],
    "{first}–{last} of {total}": [
        "第 {first}–{last} 项，共 {total} 项",
        "第 {first}–{last} 項，共 {total} 項",
    ],
    "AsterMargin plans, calls tools, and reads long documents. Choose a model with an Artificial Analysis score of at least 26, preferably 35 or higher.":
        [
            "星笺需要制定计划、调用工具并阅读长文档。请选择 Artificial Analysis 智能指数达到 26 分的模型，建议使用 35 分或更高的模型。",
            "星箋需要規劃、呼叫工具並閱讀長文件。請選擇 Artificial Analysis 智慧指數達 26 分的模型，建議使用 35 分或以上的模型。",
        ],
    "Small or older models may struggle with tool calls. Choose a model with an Artificial Analysis score of at least 26, preferably 35 or higher.":
        [
            "小型或较旧的模型可能不擅长调用工具。请选择 Artificial Analysis 智能指数达到 26 分的模型，建议使用 35 分或更高的模型。",
            "小型或舊版模型可能不擅長呼叫工具。請選擇 Artificial Analysis 智慧指數達 26 分的模型，建議使用 35 分或以上的模型。",
        ],
    "Switch between author-year (e.g., Smith, 2023) and numeric (e.g., [1]) citation formats":
        [
            "在作者－年份（Smith, 2023）和数字编号 [1] 格式之间切换",
            "在作者－年份（Smith, 2023）和數字編號 [1] 格式之間切換",
        ],
    "Add Selected Items to New Threads": [
        "将选中的条目添加到新对话",
        "將選取的項目加入新對話",
    ],
    "Automatically include items selected in Zotero when creating a new chat thread.":
        [
            "新建对话时自动添加在 Zotero 中选中的条目。",
            "新增對話時自動加入在 Zotero 中選取的項目。",
        ],
    "When enabled, any items you have selected in Zotero will be automatically added as sources when you start a new conversation thread.":
        [
            "新建对话时，Zotero 中选中的条目会自动添加为来源。",
            "新增對話時，Zotero 中選取的項目會自動加入為來源。",
        ],
    "Add Selected Items When Opening AsterMargin": [
        "打开星笺时添加选中的条目",
        "開啟星箋時加入選取的項目",
    ],
    "Automatically include items selected in Zotero when opening the AsterMargin sidebar.":
        [
            "打开星笺侧栏时自动添加所选条目。",
            "開啟星箋側邊欄時自動加入選取的項目。",
        ],
    "Enter your Google AI Studio API Key": [
        "输入 Google AI Studio API 密钥",
        "輸入 Google AI Studio API 金鑰",
    ],
    "Enter your OpenAI API Key": [
        "输入 OpenAI API 密钥",
        "輸入 OpenAI API 金鑰",
    ],
    "Enter your Anthropic API Key": [
        "输入 Anthropic API 密钥",
        "輸入 Anthropic API 金鑰",
    ],
    "Connect your own API keys or add a custom endpoint. Keys with higher rate limits (Tier 2 or above) work best.":
        [
            "你可以使用自己的 API 密钥，也可以添加自定义端点。建议使用请求额度较高（第 2 级或更高）的密钥。",
            "你可以使用自己的 API 金鑰，也可以新增自訂端點。建議使用請求額度較高（第 2 級或以上）的金鑰。",
        ],
    "API key setup guide": ["API 密钥设置指南", "API 金鑰設定指南"],
    "Custom endpoint setup guide": ["自定义端点设置指南", "自訂端點設定指南"],
    "This applies on every device signed in to your account.": [
        "此设置适用于登录同一账户的所有设备。",
        "此設定適用於登入同一帳號的所有裝置。",
    ],
    "Explain the selected passage or annotation(s) from this paper in plain language. Provide context for any technical terms, statistical methods, or domain-specific concepts. If it references other work, briefly explain that context too.":
        [
            "用通俗语言解释这篇论文中选中的段落或批注。补充理解技术术语、统计方法或领域概念所需的背景。如果涉及其他研究，也简要介绍相关背景。",
            "用淺白的文字解釋這篇論文中選取的段落或註解。補充理解技術術語、統計方法或領域概念所需的背景。如果提及其他研究，也請簡要說明相關背景。",
        ],
} as const;

type SettingsMessage = keyof typeof messages;
type MessageArgs = Record<string, string | number>;

export function settingsText(
    message: SettingsMessage,
    args?: MessageArgs,
): string {
    const locale = interfaceLocale();
    const text =
        locale === "en"
            ? message
            : messages[message][locale === "zh-TW" ? 1 : 0];
    return args
        ? text.replace(/\{(\w+)\}/g, (token, name: string) =>
              String(args[name] ?? token),
          )
        : text;
}

/** For messages originating in shared code and user-facing technical diagnostics. */
export function knownSettingsText(message: string): string {
    return Object.hasOwn(messages, message)
        ? settingsText(message as SettingsMessage)
        : message;
}
