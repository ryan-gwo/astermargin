import { afterEach, describe, expect, it, vi } from "vitest";
import { discoverProviderModels } from "../../../react/components/preferences/localProviderTest";

describe("provider model discovery", () => {
    afterEach(() => vi.restoreAllMocks());

    it("loads current model metadata with bearer authentication", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: [
                        {
                            id: "deepseek-flash",
                            context_window: 1048576,
                            input_modalities: ["text", "image"],
                            effort: {
                                supported_levels: ["low", "high", "max"],
                            },
                        },
                    ],
                }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" },
                },
            ),
        );

        const models = await discoverProviderModels({
            api_base: "https://api.example.com/v1",
            api_key: "secret",
            format: "openai",
            name: "Example",
            snapshot: "",
            supports_vision: false,
        });

        expect(models).toEqual([
            {
                id: "deepseek-flash",
                contextWindow: 1048576,
                supportsVision: true,
                reasoningEfforts: ["low", "high", "max"],
            },
        ]);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.example.com/v1/models",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer secret",
                }),
            }),
        );
    });

    it("uses the Gemini key query parameter for the Gemini model endpoint", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(
                new Response(
                    JSON.stringify({
                        models: [{ name: "models/gemini-3.1-pro" }],
                    }),
                    { status: 200 },
                ),
            );
        const models = await discoverProviderModels({
            api_base: "https://generativelanguage.googleapis.com/v1beta",
            api_key: "AIza-test",
            format: "openai",
            name: "Gemini",
            snapshot: "",
            supports_vision: false,
        });

        expect(models[0]?.id).toBe("models/gemini-3.1-pro");
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "https://generativelanguage.googleapis.com/v1beta/models?key=AIza-test",
        );
    });
});
