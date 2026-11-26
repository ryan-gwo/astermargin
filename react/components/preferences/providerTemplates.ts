import type { CustomChatModel, CustomModelFormat } from "../../types/settings";

export interface ProviderTemplate {
    id: string;
    label: string;
    description: string;
    apiBase: string;
    format: CustomModelFormat;
    /**
     * Kept for compatibility with older saved UI state. Provider templates do
     * not ship a model catalogue because provider model IDs change frequently.
     * The endpoint is queried after the user supplies its API key.
     */
    models?: readonly string[];
    apiKeyPlaceholder: string;
    local?: boolean;
}

/** Provider presets keep the endpoint and protocol details out of the setup
 * form while leaving the key and model under the user's control. */
export const PROVIDER_TEMPLATES: readonly ProviderTemplate[] = [
    {
        id: "openai",
        label: "OpenAI",
        description:
            "OpenAI API. Enter the endpoint and key, then load the models offered by your account.",
        apiBase: "https://api.openai.com/v1",
        format: "openai_responses",
        models: [],
        apiKeyPlaceholder: "sk-...",
    },
    {
        id: "anthropic",
        label: "Anthropic",
        description:
            "Anthropic Messages API. Enter the endpoint and key, then load the models offered by your account.",
        apiBase: "https://api.anthropic.com/v1",
        format: "anthropic",
        models: [],
        apiKeyPlaceholder: "sk-ant-...",
    },
    {
        id: "gemini",
        label: "Google Gemini",
        description:
            "Gemini OpenAI-compatible API. Enter the endpoint and key, then load the models offered by your account.",
        apiBase: "https://generativelanguage.googleapis.com/v1beta/openai",
        format: "openai",
        models: [],
        apiKeyPlaceholder: "AIza...",
    },
    {
        id: "deepseek",
        label: "DeepSeek",
        description:
            "DeepSeek OpenAI-compatible API. Enter the endpoint and key, then load the models offered by your account.",
        apiBase: "https://api.deepseek.com/v1",
        format: "openai",
        models: [],
        apiKeyPlaceholder: "sk-...",
    },
    {
        id: "qwen",
        label: "Alibaba Qwen",
        description:
            "Qwen DashScope compatible-mode API. Enter the endpoint and key, then load the models offered by your account.",
        apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        format: "openai",
        models: [],
        apiKeyPlaceholder: "sk-...",
    },
    {
        id: "openrouter",
        label: "OpenRouter",
        description:
            "OpenRouter API. Enter the endpoint and key, then load the models available to your account.",
        apiBase: "https://openrouter.ai/api/v1",
        format: "openai",
        models: [],
        apiKeyPlaceholder: "sk-or-...",
    },
    {
        id: "ollama",
        label: "Ollama",
        description:
            "Ollama local API. Enter the endpoint, optionally enter a key, then load installed models.",
        apiBase: "http://127.0.0.1:11434/v1",
        format: "openai",
        models: [],
        apiKeyPlaceholder: "Optional",
        local: true,
    },
    {
        id: "lmstudio",
        label: "LM Studio",
        description:
            "LM Studio local OpenAI-compatible API. Enter the endpoint, optionally enter a key, then load loaded models.",
        apiBase: "http://127.0.0.1:1234/v1",
        format: "openai",
        models: [],
        apiKeyPlaceholder: "Optional",
        local: true,
    },
];

export function modelFromTemplate(template: ProviderTemplate): CustomChatModel {
    return {
        name: template.label,
        snapshot: "",
        api_base: template.apiBase,
        format: template.format,
        api_key: "",
        supports_vision: false,
    };
}
