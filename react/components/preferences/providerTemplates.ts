import type { CustomChatModel, CustomModelFormat } from "../../types/settings";

export interface ProviderTemplate {
    id: string;
    label: string;
    description: string;
    apiBase: string;
    format: CustomModelFormat;
    models: string[];
    apiKeyPlaceholder: string;
    local?: boolean;
}

/** Provider presets keep the endpoint and protocol details out of the setup
 * form while leaving the key and model under the user's control. */
export const PROVIDER_TEMPLATES: readonly ProviderTemplate[] = [
    {
        id: "openai",
        label: "OpenAI",
        description: "OpenAI Chat Completions or Responses",
        apiBase: "https://api.openai.com/v1",
        format: "openai_responses",
        models: ["gpt-5", "gpt-5-mini", "gpt-4.1"],
        apiKeyPlaceholder: "sk-...",
    },
    {
        id: "anthropic",
        label: "Anthropic",
        description: "Anthropic Messages API",
        apiBase: "https://api.anthropic.com/v1",
        format: "anthropic",
        models: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"],
        apiKeyPlaceholder: "sk-ant-...",
    },
    {
        id: "gemini",
        label: "Google Gemini",
        description: "Gemini OpenAI-compatible endpoint",
        apiBase: "https://generativelanguage.googleapis.com/v1beta/openai",
        format: "openai",
        models: ["gemini-2.5-pro", "gemini-2.5-flash"],
        apiKeyPlaceholder: "AIza...",
    },
    {
        id: "deepseek",
        label: "DeepSeek",
        description: "DeepSeek Chat Completions",
        apiBase: "https://api.deepseek.com/v1",
        format: "openai",
        models: ["deepseek-chat", "deepseek-reasoner"],
        apiKeyPlaceholder: "sk-...",
    },
    {
        id: "qwen",
        label: "Alibaba Qwen",
        description: "DashScope compatible-mode endpoint",
        apiBase: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        format: "openai",
        models: ["qwen-plus", "qwen-max", "qwen3-235b-a22b"],
        apiKeyPlaceholder: "sk-...",
    },
    {
        id: "openrouter",
        label: "OpenRouter",
        description: "Many hosted models behind one endpoint",
        apiBase: "https://openrouter.ai/api/v1",
        format: "openai",
        models: ["openai/gpt-4.1", "anthropic/claude-sonnet-4", "google/gemini-2.5-pro"],
        apiKeyPlaceholder: "sk-or-...",
    },
    {
        id: "ollama",
        label: "Ollama",
        description: "Local models on this computer",
        apiBase: "http://127.0.0.1:11434/v1",
        format: "openai",
        models: ["qwen3:8b", "llama3.2", "mistral"],
        apiKeyPlaceholder: "Optional",
        local: true,
    },
    {
        id: "lmstudio",
        label: "LM Studio",
        description: "Local OpenAI-compatible server",
        apiBase: "http://127.0.0.1:1234/v1",
        format: "openai",
        models: ["local-model"],
        apiKeyPlaceholder: "Optional",
        local: true,
    },
];

export function modelFromTemplate(template: ProviderTemplate, model: string): CustomChatModel {
    return {
        name: template.label,
        snapshot: model,
        api_base: template.apiBase,
        format: template.format,
        api_key: "",
        supports_vision: false,
    };
}
