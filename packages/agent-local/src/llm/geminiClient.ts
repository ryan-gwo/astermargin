import { readSseEvents } from "./sseReader";
import {
    classifyHttpStatus,
    joinEndpoint,
    LlmRequestError,
    providerErrorMessage,
    type LlmClient,
    type LlmMessage,
    type LlmUsage,
} from "./types";
import type { AccumulatedToolCall } from "./toolCallAccumulator";

function contents(messages: LlmMessage[]) {
    const names = new Map<string, string>();
    const out: { role: string; parts: unknown[] }[] = [];
    for (const m of messages) {
        if (m.role === "system") continue;
        const role = m.role === "assistant" ? "model" : "user";
        for (const c of m.toolCalls ?? []) names.set(c.id, c.name);
        const parts =
            m.role === "tool"
                ? [
                      {
                          functionResponse: {
                              name: names.get(m.toolCallId ?? ""),
                              response: { result: m.content },
                          },
                      },
                  ]
                : m.providerBlocks?.length
                  ? m.providerBlocks
                  : [
                        ...(m.content ? [{ text: m.content }] : []),
                        ...(m.images ?? []).map((data) => ({
                            inlineData: { mimeType: "image/png", data },
                        })),
                        ...(m.toolCalls ?? []).map((c) => ({
                            functionCall: { name: c.name, args: c.args },
                        })),
                    ];
        const last = out[out.length - 1];
        if (last?.role === role) last.parts.push(...parts);
        else out.push({ role, parts: [...parts] });
    }
    return out;
}
export function createGeminiClient(): LlmClient {
    return {
        async streamTurn(request, handlers, signal) {
            const { model, messages, tools } = request;
            const base =
                model.api_base?.replace(/\/+$/, "") ||
                "https://generativelanguage.googleapis.com/v1beta";
            const url = joinEndpoint(
                base,
                "models/" +
                    encodeURIComponent(
                        model.snapshot.replace(/^models\//, ""),
                    ) +
                    ":streamGenerateContent?alt=sse",
            );
            const body = {
                systemInstruction: {
                    parts: messages
                        .filter((m) => m.role === "system")
                        .map((m) => ({ text: m.content })),
                },
                contents: contents(messages),
                ...(tools.length
                    ? {
                          tools: [
                              {
                                  functionDeclarations: tools.map((t) => ({
                                      name: t.name,
                                      description: t.description,
                                      parametersJsonSchema: t.parameters,
                                  })),
                              },
                          ],
                          toolConfig: {
                              functionCallingConfig: {
                                  mode:
                                      request.toolChoice === "none"
                                          ? "NONE"
                                          : "AUTO",
                              },
                          },
                      }
                    : {}),
            };
            const cancelled = () =>
                new LlmRequestError("cancelled", "Request cancelled");
            if (signal.aborted) throw cancelled();
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": model.api_key,
                    },
                    body: JSON.stringify(body),
                    signal,
                });
                if (!response.ok)
                    throw new LlmRequestError(
                        classifyHttpStatus(response.status),
                        providerErrorMessage(
                            await response.text(),
                            "Gemini HTTP " + response.status,
                        ),
                    );
                if (!response.body)
                    throw new LlmRequestError(
                        "network",
                        "Gemini returned no stream",
                    );
                let text = "",
                    thinking = "",
                    stop = "",
                    usage: LlmUsage | null = null;
                const toolCalls: AccumulatedToolCall[] = [],
                    blocks: unknown[] = [];
                for await (const frame of readSseEvents(
                    response.body,
                    signal,
                )) {
                    const chunk = JSON.parse(frame.data);
                    if (chunk.error || chunk.promptFeedback?.blockReason)
                        throw new LlmRequestError(
                            "bad_request",
                            chunk.error?.message ||
                                chunk.promptFeedback.blockReason,
                        );
                    const candidate = chunk.candidates?.[0];
                    stop = candidate?.finishReason || stop;
                    for (const p of candidate?.content?.parts ?? []) {
                        blocks.push(p);
                        if (typeof p.text === "string") {
                            if (p.thought) {
                                thinking += p.text;
                                handlers.onThinkingDelta(thinking);
                            } else {
                                text += p.text;
                                handlers.onTextDelta(text);
                            }
                        }
                        if (p.functionCall) {
                            const c = p.functionCall;
                            toolCalls.push({
                                id: c.id || crypto.randomUUID(),
                                name: c.name,
                                args: c.args ?? {},
                                rawArgs: JSON.stringify(c.args ?? {}),
                                parseError: null,
                            });
                        }
                    }
                    const u = chunk.usageMetadata;
                    if (u)
                        usage = {
                            inputTokens: u.promptTokenCount ?? 0,
                            outputTokens:
                                (u.candidatesTokenCount ?? 0) +
                                (u.thoughtsTokenCount ?? 0),
                        };
                }
                if (signal.aborted) throw cancelled();
                if (!stop || !["STOP", "MAX_TOKENS"].includes(stop))
                    throw new LlmRequestError(
                        "server",
                        "Gemini ended with " + (stop || "an incomplete stream"),
                    );
                return {
                    text,
                    thinking,
                    toolCalls,
                    usage,
                    providerBlocks: blocks,
                    finishReason: toolCalls.length
                        ? "tool_calls"
                        : stop === "MAX_TOKENS"
                          ? "length"
                          : "stop",
                };
            } catch (error) {
                if (signal.aborted) throw cancelled();
                throw error;
            }
        },
    };
}
