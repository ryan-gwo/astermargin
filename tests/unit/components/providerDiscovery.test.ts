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
                            context_length: 1048576,
                            architecture: { input_modalities: ["text", "image"] },
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

    it("authenticates the native Gemini catalogue using its key header", async () => {
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
            format: "gemini",
            name: "Gemini",
            snapshot: "",
            supports_vision: false,
        });

        expect(models[0]?.id).toBe("models/gemini-3.1-pro");
        expect(fetchMock).toHaveBeenCalledWith(
            "https://generativelanguage.googleapis.com/v1beta/models",
            expect.objectContaining({ headers: expect.objectContaining({
                "x-goog-api-key": "AIza-test",
            }) }),
        );
    });
    it("uses bearer authentication for the Gemini OpenAI-compatible template", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
            Response.json({ data: [{ id: "gemini-pro" }] }),
        );
        await discoverProviderModels({
            api_base: "https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key: "gemini-key",
            format: "openai",
            name: "Gemini",
            snapshot: "",
            supports_vision: false,
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "https://generativelanguage.googleapis.com/v1beta/openai/models",
            expect.objectContaining({ headers: expect.objectContaining({
                Authorization: "Bearer gemini-key",
            }) }),
        );
    });

    it("follows an Anthropic catalogue cursor and reads its capability metadata", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(Response.json({
                data: [{ id: "first" }], has_more: true, last_id: "first",
            }))
            .mockResolvedValueOnce(Response.json({
                data: [{ id: "second", display_name: "Second", max_input_tokens: 32000,
                    capabilities: { image_input: { supported: false },
                        effort: { high: { supported: true }, max: { supported: false } } } }],
                has_more: false,
            }));
        const models = await discoverProviderModels({
            api_base: "https://api.anthropic.com/v1",
            api_key: "anthropic-key",
            format: "anthropic",
            name: "Anthropic",
            snapshot: "",
            supports_vision: true,
        });
        expect(models.map(({ id }) => id)).toEqual(["first", "second"]);
        expect(models[1]).toMatchObject({
            displayName: "Second", contextWindow: 32000,
            supportsVision: false, reasoningEfforts: ["high"],
        });
        expect(fetchMock).toHaveBeenLastCalledWith(
            "https://api.anthropic.com/v1/models?after_id=first",
            expect.objectContaining({ headers: expect.objectContaining({
                "x-api-key": "anthropic-key",
                "anthropic-version": "2023-06-01",
            }) }),
        );
    });
});
