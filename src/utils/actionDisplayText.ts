import type { Action } from "@astermargin/agent-core/types/actions";
import { ALL_BUILTIN_ACTIONS } from "../../react/types/builtinActions";
import { interfaceLocale } from "./interfaceLanguage";

// Shared by the native Zotero integration and React action surfaces.
export const builtinActionMessages = {
    Annotate: ["批注", "註解"],
    Summarize: ["概括文献", "摘要文獻"],
    "Write a Zotero note summarizing each item so you can recall it at a glance.":
        [
            "为每个条目撰写 Zotero 摘要笔记，方便日后快速回顾。",
            "為每個項目撰寫 Zotero 摘要筆記，方便日後快速回顧。",
        ],
    "How does this fit into my library?": [
        "这篇论文和库中哪些文献相关？",
        "這篇論文和庫中哪些文獻相關？",
    ],
    "Position this paper against the rest of your library. What it supports, challenges, and extends.":
        [
            "结合库内文献，梳理这篇论文支持、质疑或拓展了哪些已有结论。",
            "結合庫內文獻，梳理這篇論文支持、質疑或拓展了哪些既有結論。",
        ],
    "Find similar papers": ["查找相关论文", "尋找相關論文"],
    "Search for research outside of your library to find closely related work.":
        [
            "在文献库以外检索主题相近的研究。",
            "在文獻庫以外檢索主題相近的研究。",
        ],
    "Auto-tag": ["自动添加标签", "自動加入標籤"],
    "Assign consistent Zotero tags to the selected items, reusing your existing tags.":
        [
            "优先复用现有标签，为选中的条目统一添加 Zotero 标签。",
            "優先沿用現有標籤，為選取的項目統一加入 Zotero 標籤。",
        ],
    "Sort into collections": ["按分类整理", "依分類整理"],
    "File the selected items into the collections where they best belong.": [
        "将选中的条目归入最合适的分类。",
        "將選取的項目歸入最合適的分類。",
    ],
    "Fix metadata": ["修正元数据", "修正詮釋資料"],
    "Fill in missing abstracts, DOIs, and other core fields, verified against external sources for a set of items or everything in a collection.":
        [
            "根据外部来源核对并补齐一组条目或整个分类中缺失的摘要、DOI 等关键字段。",
            "依據外部來源核對並補齊一組項目或整個分類中缺少的摘要、DOI 等重要欄位。",
        ],
    "Skim this paper": ["速读这篇论文", "略讀這篇論文"],
    "Add highlight annotations to key passages so you can grasp the paper in a few minutes.":
        [
            "高亮标记关键段落，方便在几分钟内掌握论文要点。",
            "以醒目提示標記重要段落，方便在幾分鐘內掌握論文要點。",
        ],
    "Color-code this paper": ["为论文添加分类高亮", "依類別標示論文重點"],
    "Add color-coded highlights for question, methods, results, and limitations.":
        [
            "用不同颜色标记研究问题、方法、结果和局限。",
            "以不同色彩標記研究問題、方法、結果和限制。",
        ],
    "Find key references from this paper": [
        "找出这篇论文的关键参考文献",
        "找出這篇論文的重要參考文獻",
    ],
    "Identify key references in this paper, and whether you already have them.":
        [
            "找出论文中的关键参考文献，检查哪些已在你的文献库中。",
            "找出論文中的重要參考文獻，確認哪些已在你的文獻庫中。",
        ],
    "What am I missing in this collection?": [
        "这个分类还缺哪些文献？",
        "這個分類還缺哪些文獻？",
    ],
    "Analyze this collection and suggest papers that fill its most important gaps.":
        [
            "分析当前分类并推荐可填补重要空白的论文。",
            "分析目前分類並推薦可填補重要缺口的論文。",
        ],
    "Organize into thematic sub-collections": [
        "按主题整理到子分类",
        "依主題整理至子分類",
    ],
    "Propose and create thematic sub-collections for the items in this collection.":
        [
            "为当前分类里的条目拟定并创建主题子分类。",
            "為目前分類中的項目擬定並建立主題子分類。",
        ],
    "Write a literature review": ["撰写文献综述", "撰寫文獻回顧"],
    "Write a thematic, cited literature review as a Zotero note from a collection, selected papers, or a topic.":
        [
            "根据分类、选中的论文或给定主题，撰写附有引文的 Zotero 文献综述笔记。",
            "根據分類、選取的論文或指定主題，撰寫附有引文的 Zotero 文獻回顧筆記。",
        ],
    "Start a research project": ["开始研究项目", "開始研究專案"],
    "Create a new Zotero collection and populate it from your library and external search.":
        [
            "建立 Zotero 分类，并加入从文献库和外部检索找到的条目。",
            "建立 Zotero 分類，並加入從文獻庫和外部檢索找到的項目。",
        ],
    "Create a research table": ["创建研究表格", "建立研究表格"],
    "Ask the same questions of every paper in a collection, a selection, or on a topic.":
        [
            "对分类内、选中的或给定主题下的每篇论文提出同一组问题。",
            "對分類內、選取的或指定主題下的每篇論文提出同一組問題。",
        ],
    "Discover new research": ["发现新研究", "探索新研究"],
    "Find notable recent or influential papers in your area that are not yet in your library.":
        [
            "查找尚未入库、与你研究方向相关的近期成果或有影响力的论文。",
            "尋找尚未加入文獻庫、與你研究方向相關的近期成果或具影響力的論文。",
        ],
    "Create targeted highlight annotations across a document or your whole library.":
        [
            "在一份文档或整个文献库中为指定内容创建高亮批注。",
            "在一份文件或整個文獻庫中為指定內容建立醒目註解。",
        ],
    "Create a Zotero note": ["创建 Zotero 笔记", "建立 Zotero 筆記"],
    "Write a Zotero note on a topic, synthesized and cited from your library.":
        [
            "归纳库内文献，撰写有引文的专题 Zotero 笔记。",
            "綜整庫內文獻，撰寫附有引文的專題 Zotero 筆記。",
        ],
    "Tidy up my library": ["整理我的文献库", "整理我的文獻庫"],
    "Find what needs organizing (unfiled items, tags, or metadata) then clean it up.":
        [
            "找出待整理的未归类条目、标签或元数据并处理。",
            "找出待整理的未分類項目、標籤或詮釋資料並處理。",
        ],
    "Quick answer": ["快速回答", "快速回覆"],
    "Answer a quick question directly, with no tools or library search.": [
        "直接回答简短问题，不调用工具或检索文献库。",
        "直接回答簡短問題，不呼叫工具或檢索文獻庫。",
    ],
    "Highlight key findings": ["高亮关键发现", "標示重要發現"],
    "Check and strengthen citations": ["核对并补充引文", "核對並補充引文"],
    "Review and give feedback on this note": [
        "审阅笔记并给出反馈",
        "審閱筆記並提供建議",
    ],
    "Edit this note for clarity and structure": [
        "编辑笔记的表述与结构",
        "編輯筆記的表達與結構",
    ],
    "Summarize this collection": ["概括这个分类的文献", "摘要此分類的文獻"],
    "Tag all items in this collection": [
        "为分类中的所有条目添加标签",
        "為分類中的所有項目加入標籤",
    ],
    "Organize my recent additions": [
        "整理近期添加的条目",
        "整理近期新增的項目",
    ],
    "Tag all untagged items": [
        "为未标记的条目添加标签",
        "為沒有標籤的項目加入標籤",
    ],
} as const;

type DisplayAction = Pick<Action, "id" | "title" | "description">;

const builtins = new Map(
    ALL_BUILTIN_ACTIONS.map((action) => [action.id, action]),
);

export function actionDisplayText(action: DisplayAction, field: "title"): string;
export function actionDisplayText(
    action: DisplayAction,
    field: "description",
): string | undefined;
export function actionDisplayText(
    action: DisplayAction,
    field: "title" | "description",
) {
    const value = action[field];
    const original = builtins.get(action.id)?.[field];
    const locale = interfaceLocale();
    if (locale === "en" || !value || value !== original) return value;
    const key = value as keyof typeof builtinActionMessages;
    return Object.hasOwn(builtinActionMessages, key)
        ? builtinActionMessages[key][locale === "zh-TW" ? 1 : 0]
        : value;
}
