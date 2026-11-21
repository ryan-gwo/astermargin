import { settingsText } from "../../utils/settingsText";
import { localConfigErrorText } from "./localModeSettings";
import { clientForFormat } from "@astermargin/agent-local/llm/clientForFormat";
import { resolveLocalAgentConfig } from "@astermargin/agent-local/config/localAgentConfig";
import type { CustomChatModel } from "@astermargin/agent-core/types/customChatModel";
import type { LlmTurnRequest } from "@astermargin/agent-local/llm/types";

export async function checkModelCapabilities(
    model: CustomChatModel,
    signal: AbortSignal,
    document: Document,
) {
    const cfg = resolveLocalAgentConfig({ model, maxRounds: 1 });
    if (!cfg.ok) throw new Error(localConfigErrorText(cfg.reason));
    const client = clientForFormat(cfg.config.model.format ?? "openai"),
        results: string[] = [];
    const turn = (
        messages: LlmTurnRequest["messages"],
        tools: LlmTurnRequest["tools"],
        text: (s: string) => void,
    ) =>
        client.streamTurn(
            { model: cfg.config.model, messages, tools },
            { onTextDelta: text, onThinkingDelta() {} },
            signal,
        );
    const nonce = crypto.randomUUID().slice(0, 8);
    const check = async (label: string, work: () => Promise<boolean>) => {
        try {
            results.push(label + " " + ((await work()) ? "✓" : "✗"));
        } catch (error) {
            if (signal.aborted) throw error;
            results.push(label + " ✗ " + String(error));
        }
    };
    await check(settingsText("Streaming"), async () => {
        let updates = 0;
        const r = await turn(
            [
                {
                    role: "user",
                    content:
                        "Respond with the following text exactly: " + nonce,
                },
            ],
            [],
            () => updates++,
        );
        return updates > 0 && r.text.trim() === nonce;
    });
    await check(settingsText("Tool calling"), async () => {
        const r = await turn(
            [
                {
                    role: "user",
                    content: "Call capability_echo with token " + nonce + ".",
                },
            ],
            [
                {
                    name: "capability_echo",
                    description:
                        "Echo a token for a harmless capability check.",
                    parameters: {
                        type: "object",
                        additionalProperties: false,
                        required: ["token"],
                        properties: { token: { type: "string" } },
                    },
                },
            ],
            () => {},
        );
        return r.toolCalls.some(
            (c) => c.name === "capability_echo" && c.args.token === nonce,
        );
    });
    await check(settingsText("Vision"), async () => {
        const canvas = document.createElementNS(
            "http://www.w3.org/1999/xhtml",
            "canvas",
        ) as HTMLCanvasElement;
        canvas.width = 240;
        canvas.height = 72;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        const token = crypto.randomUUID().slice(0, 6).toUpperCase();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 240, 72);
        ctx.fillStyle = "black";
        ctx.font = "bold 40px monospace";
        ctx.fillText(token, 15, 50);
        const image = canvas.toDataURL("image/png").split(",")[1];
        const r = await turn(
            [
                {
                    role: "user",
                    content: "Transcribe only the characters in this image.",
                    images: [image],
                },
            ],
            [],
            () => {},
        );
        return r.text.trim().toUpperCase() === token;
    });
    return results.join(" · ");
}
