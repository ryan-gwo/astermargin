const words: Record<string, readonly [string, string]> = {
    "How can I help you?": ["想读哪篇文献？", "想讀哪篇文獻？"],
    General: ["通用", "通用"],
    "Search & Files": ["检索与文件", "檢索與檔案"],
    Permissions: ["权限", "許可權"],
    "Plan & Usage": ["方案与用量", "方案與用量"],
    "API Keys": ["API 密钥", "API 金鑰"],
    Actions: ["动作", "動作"],
    Advanced: ["高级", "高階"],
    "Custom Providers": ["自定义模型服务", "自定義模型服務"],
    "Add Provider": ["添加服务", "新增服務"],
    "Test Endpoint": ["测试端点", "測試端點"],
    "Endpoint works": ["端点可用", "端點可用"],
    "Model (snapshot)": ["模型名称（快照）", "模型名稱（快照）"],
    Name: ["显示名称", "顯示名稱"],
    "Endpoint URL (api_base)": ["服务地址（api_base）", "服務地址（api_base）"],
    Format: ["协议格式", "協議格式"],
    "Context window": ["上下文窗口", "上下文視窗"],
    "API key": ["API 密钥", "API 金鑰"],
    "Supports vision (image input)": [
        "支持视觉（图像输入）",
        "支援視覺（影像輸入）",
    ],
    "Untitled provider": ["未命名服务", "未命名服務"],
    "Optional instructions, then approve or reject": [
        "可补充说明，再批准或拒绝",
        "可補充說明，再批准或拒絕",
    ],
    "@ to add a source, / for actions": [
        "输入 @ 添加来源，输入 / 选择动作",
        "輸入 @ 新增來源，輸入 / 選擇動作",
    ],
    "@ to add a source, / for actions, drag to add annotations": [
        "输入 @ 添加来源，输入 / 选择动作，也可以拖入批注",
        "輸入 @ 新增來源，輸入 / 選擇動作，也可以拖入批註",
    ],
    "Search actions...": ["搜索动作…", "搜尋動作…"],
    "Message AsterMargin": ["向星笺提问", "向星箋提問"],
    "Local mode": ["本机模式", "本機模式"],
    Search: ["检索", "檢索"],
    Model: ["模型", "模型"],
    "Research sync": ["研究数据同步", "研究資料同步"],
    "New Chat": ["新对话", "新對話"],
    Settings: ["设置", "設定"],
    "Get Help": ["获取帮助", "取得說明"],
    "AsterMargin settings": ["星笺设置", "星箋設定"],
    "AsterMargin Actions": ["星笺动作", "星箋動作"],
    "Add custom action…": ["添加自定义动作…", "新增自定義動作…"],
    "Export with AsterMargin": ["用星笺导出", "用星箋匯出"],
    "New AsterMargin Table": ["新建星笺研究表格", "新建星箋研究表格"],
    "Create AsterMargin Table": ["创建星笺研究表格", "建立星箋研究表格"],
    Close: ["关闭", "關閉"],
    Table: ["表格", "表格"],
    "Show in Library": ["在文献库中显示", "在文獻庫中顯示"],
    "Export to Excel…": ["导出为 Excel…", "匯出為 Excel…"],
    "Export as CSV…": ["导出为 CSV…", "匯出為 CSV…"],
    "Copy Table as Text": ["将表格复制为文本", "將表格複製為文本"],
    "Find in Table": ["在表格中查找", "在表格中查詢"],
    "Compact Rows": ["紧凑行高", "緊湊行高"],
    "Default Rows": ["默认行高", "預設行高"],
    "Tall Rows": ["宽松行高", "寬鬆行高"],
    "Show Hidden Columns": ["显示隐藏列", "顯示隱藏列"],
    "Clear Search and Filters": ["清除搜索与筛选", "清除搜尋與篩選"],
    "Clear Sort": ["清除排序", "清除排序"],
    "Version History": ["版本历史", "版本歷史"],
    "Add Items…": ["添加条目…", "新增條目…"],
    "Add Column…": ["添加列…", "新增列…"],
    "Add New Items from Sources": ["从来源添加新条目", "從來源新增新條目"],
    "Sources…": ["来源…", "來源…"],
    "Fill Everything Pending": ["填充全部待处理单元格", "填充全部待處理單元格"],
    "Try Fill on 5 Rows": ["试填 5 行", "試填 5 行"],
    "Fill Selected Rows": ["填充选中行", "填充選中行"],
    "Retry Rows That Failed": ["重试失败行", "重試失敗行"],
    "Stop Fill": ["停止填充", "停止填充"],
    "Remove Selected Rows": ["移除选中行", "移除選中行"],
    "Ask AsterMargin About This Table": [
        "向星笺询问此表格",
        "向星箋詢問此表格",
    ],
    Open: ["打开", "開啟"],
    "AsterMargin Table": ["星笺研究表格", "星箋研究表格"],
    "AsterMargin Tables": ["星笺研究表格", "星箋研究表格"],
    "in New Tab": ["在新标签页中", "在新標籤頁中"],
    "in New Window": ["在新窗口中", "在新視窗中"],
    Account: ["账户", "賬戶"],
    "Google API Key": ["Google API 密钥", "Google API 金鑰"],
    "Anthropic API Key": ["Anthropic API 密钥", "Anthropic API 金鑰"],
    "OpenAI API Key": ["OpenAI API 密钥", "OpenAI API 金鑰"],
    Enable: ["启用", "啟用"],
    Title: ["标题", "標題"],
    Detail: ["详情", "詳情"],
    Input: ["输入", "輸入"],
    "AsterMargin Status": ["星笺状态", "星箋狀態"],
};
export function interfaceLocale(): "en" | "zh-CN" | "zh-TW" {
    const lang = String(typeof Zotero === "undefined" ? "" : Zotero.locale);
    if (!/^zh(?:[-_]|$)/i.test(lang)) return "en";
    return /(?:^|[-_])(?:Hant|TW|HK|MO)(?:[-_]|$)/i.test(lang)
        ? "zh-TW"
        : "zh-CN";
}

export function uiText(english: string) {
    const locale = interfaceLocale();
    return locale === "en"
        ? english
        : (words[english]?.[locale === "zh-TW" ? 1 : 0] ?? english);
}
