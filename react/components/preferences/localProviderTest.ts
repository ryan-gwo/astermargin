/**
 * "Test Endpoint" for a custom provider in local mode: a single, tool-free
 * turn sent straight to the provider from the plugin, through the same
 * `LlmClient` the local agent loop uses. Unlike the hosted rock-paper-scissors
 * check (`chatService.testCustomProviderRockPaperScissors`), this never goes
 * through AsterMargin's backend — the api key and endpoint stay on this machine.
 */
import { localConfigErrorText } from "./localModeSettings";
import { settingsText } from "../../utils/settingsText";
import type { CustomChatModel } from "@astermargin/agent-core/types/customChatModel";
import {
    isLoopbackEndpoint,
    resolveLocalAgentConfig,
    type SupportedFormat,
} from "@astermargin/agent-local/config/localAgentConfig";
import { clientForFormat } from "@astermargin/agent-local/llm/clientForFormat";
import type { LlmClient } from "@astermargin/agent-local/llm/types";
import { LlmRequestError } from "@astermargin/agent-local/llm/types";

export interface LocalProviderTestResult {
    ok: boolean;
    message: string;
    /**
     * True when `ok: false` came from the caller's own `externalSignal`
     * (unmount, or a newer test superseding this one) rather than a real
     * provider failure or timeout. Callers should discard these silently
     * instead of showing them as an error.
     */
    cancelled?: boolean;
}

export interface DiscoveredProviderModel {
    id: string;
    contextWindow?: number;
    supportsVision?: boolean;
    reasoningEfforts?: string[];
}

/**
 * Read the provider's current model catalogue after the user has supplied the
 * endpoint and credential. Static model lists go stale quickly and can leave
 * a valid account apparently unusable.
 */
export async function discoverProviderModels(
    model: CustomChatModel,
    signal?: AbortSignal,
): Promise<DiscoveredProviderModel[]> {
    const base = (model.api_base ?? "").trim().replace(/\/+$/u, "");
    if (!base)
        throw new Error(
            settingsText("An endpoint URL is required before loading models."),
        );
    let url = `${base}/models`;
    const headers: Record<string, string> = { Accept: "application/json" };
    const key = model.api_key?.trim();
    if (key) {
        if (
            /generativelanguage\.googleapis\.com$/iu.test(
                new URL(base).hostname,
            )
        ) {
            url += `${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
        } else if (normalizeCustomFormat(model.format) === "anthropic") {
            headers["x-api-key"] = key;
            headers["anthropic-version"] = "2023-06-01";
        } else {
            headers.Authorization = `Bearer ${key}`;
        }
    }
    const response = await fetch(url, { signal, headers });
    if (!response.ok)
        throw new Error(
            settingsText("Model loading failed ({status}).", {
                status: response.status,
            }),
        );
    const raw = (await response.json()) as {
        data?: Array<Record<string, unknown>>;
        models?: Array<Record<string, unknown>>;
    };
    const entries = Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.models)
          ? raw.models
          : [];
    return entries.flatMap((entry) => {
        const id =
            typeof entry.id === "string"
                ? entry.id
                : typeof entry.name === "string"
                  ? entry.name
                  : "";
        if (!id) return [];
        const contextWindow =
            typeof entry.context_window === "number"
                ? entry.context_window
                : typeof entry.contextWindow === "number"
                  ? entry.contextWindow
                  : undefined;
        const modalities = Array.isArray(entry.input_modalities)
            ? entry.input_modalities.filter(
                  (value): value is string => typeof value === "string",
              )
            : [];
        const reasoning =
            entry.effort && typeof entry.effort === "object"
                ? (entry.effort as { supported_levels?: unknown })
                      .supported_levels
                : undefined;
        return [
            {
                id,
                ...(contextWindow ? { contextWindow } : {}),
                ...(modalities.includes("image")
                    ? { supportsVision: true }
                    : {}),
                ...(Array.isArray(reasoning)
                    ? {
                          reasoningEfforts: reasoning.filter(
                              (value): value is string =>
                                  typeof value === "string",
                          ),
                      }
                    : {}),
            },
        ];
    });
}

/** Backward-compatible local-only name used by older callers. */
export async function discoverLocalModels(
    model: CustomChatModel,
    signal?: AbortSignal,
): Promise<string[]> {
    const resolved = resolveLocalAgentConfig({ model, maxRounds: 1 });
    if (!resolved.ok) throw new Error(localConfigErrorText(resolved.reason));
    return (await discoverProviderModels(resolved.config.model, signal)).map(
        (entry) => entry.id,
    );
}

function normalizeCustomFormat(format: CustomChatModel["format"]): string {
    return typeof format === "string" ? format.toLowerCase() : "openai";
}

const DEFAULT_TIMEOUT_MS = 20_000;
const TEST_PROMPT =
    "Reply with one short sentence to confirm you received this message.";

/**
 * Run one connectivity check against a local/custom provider endpoint.
 *
 * `externalSignal` lets the caller cancel the request (component unmount, or
 * a newer test starting) independently of the timeout; an abort from that
 * signal is reported as `cancelled`, not as a timeout or provider error.
 */
export async function testLocalProvider(
    model: CustomChatModel,
    client: LlmClient,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    externalSignal?: AbortSignal,
): Promise<LocalProviderTestResult> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener("abort", onExternalAbort);
        }
    }

    try {
        const result = await client.streamTurn(
            {
                model,
                messages: [{ role: "user", content: TEST_PROMPT }],
                tools: [],
            },
            {
                onTextDelta: () => {},
                onThinkingDelta: () => {},
            },
            controller.signal,
        );
        const text = result.text.trim();
        return {
            ok: true,
            message:
                `${settingsText("Endpoint accepted the request.")} ${text}`.trim(),
        };
    } catch (error) {
        if (error instanceof LlmRequestError && error.kind === "cancelled") {
            if (!timedOut) {
                return {
                    ok: false,
                    cancelled: true,
                    message: "The test was cancelled.",
                };
            }
            return {
                ok: false,
                message:
                    "The request timed out. Check the endpoint URL and that the server is running.",
            };
        }
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "The provider test failed.",
        };
    } finally {
        clearTimeout(timer);
        if (externalSignal)
            externalSignal.removeEventListener("abort", onExternalAbort);
    }
}

/**
 * Test a provider exactly as a chat would use it: the model goes through
 * `resolveLocalAgentConfig` first, so the test sees the same endpoint
 * defaults, key rule and format as a run, and a configuration a run would
 * refuse is reported without contacting the provider.
 */
export async function testLocalEndpoint(
    model: CustomChatModel,
    externalSignal?: AbortSignal,
    options: {
        clientFor?: (format: SupportedFormat) => LlmClient;
        timeoutMs?: number;
    } = {},
): Promise<LocalProviderTestResult> {
    const resolved = resolveLocalAgentConfig({ model, maxRounds: null });
    if (!resolved.ok)
        return { ok: false, message: localConfigErrorText(resolved.reason) };
    const format = (resolved.config.model.format ??
        "openai") as SupportedFormat;
    const client = (options.clientFor ?? clientForFormat)(format);
    return testLocalProvider(
        resolved.config.model,
        client,
        options.timeoutMs,
        externalSignal,
    );
}

/**
 * A warning for an endpoint that sends the API key and library text
 * unencrypted across a network, or null. Plain HTTP to this machine is fine.
 */
export function plainHttpWarning(apiBase: string | undefined): string | null {
    const value = (apiBase ?? "").trim();
    let protocol: string;
    try {
        protocol = new URL(value).protocol;
    } catch {
        return null;
    }
    if (protocol !== "http:" || isLoopbackEndpoint(value)) return null;
    return "This endpoint uses plain http, so your API key and library text travel unencrypted. Use https unless the server is on a network you trust.";
}
