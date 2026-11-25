import { settingsText } from "../../utils/settingsText";
import { uiText } from "../../utils/interfaceText";
import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Button from "@astermargin/agent-ui/primitives/Button";
import {SettingsGroup, SectionLabel, DocLink, ExternalLink, SectionDescription, INTELLIGENCE_INDEX_URL} from "./components/SettingsElements";
import ApiKeyInput from "./ApiKeyInput";
import CustomProviderCard from "./CustomProviderCard";
import PlusToolsSection from "./PlusToolsSection";
import PlusSignIcon from "@astermargin/agent-ui/icons/PlusSignIcon";
import { Icon, AlertIcon } from "../icons/icons";
import { getPref, setPref } from "../../../src/utils/prefs";
import { SettingsRow } from "./components/SettingsElements";
import { handlePrefSave } from "./utils";
import { refreshCustomModelsAtom } from "../../atoms/models";
import { localModeEnabledAtom, localModeForcedAtom } from "../../atoms/localMode";
import { localModeStatusAtom, localWebSearchStatusAtom } from "../../atoms/localAgentConfig";
import { usePreference } from "../../hooks/usePreference";
import {
    DEFAULT_LOCAL_WEB_SEARCH_MAX_USES,
    localRoundCapDescription,
    localWebSearchMaxUsesDescription,
    localWebSearchDescription,
    localModeToggleState,
    localConfigErrorText,
    parseLocalMaxRoundsInput,
    parseLocalWebSearchMaxUsesInput,
    showLocalRoundCap,
} from "./localModeSettings";
import { DEFAULT_MAX_ROUNDS } from "@astermargin/agent-local/config/localAgentConfig";
import {
    CustomChatModel,
    getCustomChatModelsForEditing,
    saveCustomChatModelsToPreferences,
    OPENROUTER_API_BASE,
} from "../../types/settings";
import { useSetAtom, useAtomValue } from "jotai";

/** Editor entry: a custom model plus a stable key for React list rendering. */
interface CustomProviderEntry {
    _id: string;
    model: CustomChatModel;
}

// Uses `uuid` rather than the platform `crypto.randomUUID()`: the preferences
// window is a separate realm and may not expose `crypto` at all.
const createProviderId = (): string => uuidv4();

// New providers default to OpenRouter's endpoint, the most common custom setup.
const emptyCustomModel = (): CustomChatModel => ({
    name: '',
    snapshot: '',
    api_base: OPENROUTER_API_BASE,
    format: 'openai',
    api_key: '',
    supports_vision: false,
});

const ApiKeysSection: React.FC = () => {
    const refreshCustomModels = useSetAtom(refreshCustomModelsAtom);

    // --- Local Mode ---
    // `localModeActive` reflects the running process (fixed at startup); the
    // `localMode` pref can be flipped live, so the two can disagree until a
    // restart applies the new value.
    const localModeActive = useAtomValue(localModeEnabledAtom);
    const localStatus = useAtomValue(localModeStatusAtom);
    const [localModePref, setLocalModePref] = usePreference(() => getPref('localMode'));
    const [maxRoundsText, setMaxRoundsText] = useState<string>(() => {
        const stored = getPref('localMaxRounds');
        return stored > 0 ? String(stored) : '';
    });
    const localModeForced = useAtomValue(localModeForcedAtom);
    const localModeToggle = localModeToggleState(localModePref, localModeActive, localModeForced);
    const restartNeeded = localModeToggle.restartNeeded;

    const handleLocalModeToggle = useCallback((checked: boolean) => {
        setPref('localMode', checked);
        setLocalModePref(checked);
    }, [setLocalModePref]);

    const handleMaxRoundsChange = useCallback((text: string) => {
        setMaxRoundsText(text);
        const parsed = parseLocalMaxRoundsInput(text);
        if (parsed !== null) {
            setPref('localMaxRounds', parsed);
        }
    }, []);

    // --- Local Mode: Search ---
    // Read at the start of every local run, so these apply without a restart
    // (unlike `localMode`/`localMaxRounds` above).
    const [scholarlySearchPref, setScholarlySearchPref] = usePreference(() => getPref('localScholarlySearch'));
    const [openAlexKey, setOpenAlexKey] = useState(() => getPref('openAlexApiKey'));
    const [semanticScholarKey, setSemanticScholarKey] = useState(() => getPref('semanticScholarApiKey'));
    const [webSearchPref, setWebSearchPref] = usePreference(() => getPref('localWebSearch'));
    const [maxUsesText, setMaxUsesText] = useState<string>(() => {
        const stored = getPref('localWebSearchMaxUses');
        return stored > 0 ? String(stored) : '';
    });
    const localWebSearchStatus = useAtomValue(localWebSearchStatusAtom);

    const handleScholarlySearchToggle = useCallback((checked: boolean) => {
        setPref('localScholarlySearch', checked);
        setScholarlySearchPref(checked);
    }, [setScholarlySearchPref]);

    const handleWebSearchToggle = useCallback((checked: boolean) => {
        setPref('localWebSearch', checked);
        setWebSearchPref(checked);
    }, [setWebSearchPref]);

    const handleMaxUsesChange = useCallback((text: string) => {
        setMaxUsesText(text);
        const parsed = parseLocalWebSearchMaxUsesInput(text);
        if (parsed !== null) {
            setPref('localWebSearchMaxUses', parsed);
        }
    }, []);

    // --- Atoms: API Keys ---
    const [geminiKey, setGeminiKey] = useState(() => getPref('googleGenerativeAiApiKey'));
    const [openaiKey, setOpenaiKey] = useState(() => getPref('openAiApiKey'));
    const [anthropicKey, setAnthropicKey] = useState(() => getPref('anthropicApiKey'));

    // --- State: Custom Providers ---
    const [customProviders, setCustomProviders] = useState<CustomProviderEntry[]>(() =>
        getCustomChatModelsForEditing().map((model) => ({ _id: createProviderId(), model }))
    );
    // Only one provider card is expanded at a time.
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
    // The newly added provider whose Name field should receive focus on mount.
    const [autoFocusProviderId, setAutoFocusProviderId] = useState<string | null>(null);

    // Persist the providers list to preferences and refresh the live model selector.
    const persistProviders = useCallback((entries: CustomProviderEntry[]) => {
        void saveCustomChatModelsToPreferences(entries.map((e) => e.model)).then(() => refreshCustomModels()).catch(error => window.alert(String(error)));
    }, [refreshCustomModels]);

    const handleAddProvider = useCallback(() => {
        const id = createProviderId();
        // Add new providers to the top of the list so they're immediately visible.
        setCustomProviders((prev) => {
            const next = [{ _id: id, model: emptyCustomModel() }, ...prev];
            persistProviders(next);
            return next;
        });
        setExpandedProviderId(id);
        setAutoFocusProviderId(id);
    }, [persistProviders]);

    const handleProviderChange = useCallback((id: string, model: CustomChatModel) => {
        setCustomProviders((prev) => {
            const next = prev.map((e) => (e._id === id ? { ...e, model } : e));
            persistProviders(next);
            return next;
        });
    }, [persistProviders]);

    const handleRemoveProvider = useCallback((id: string) => {
        setCustomProviders((prev) => {
            const next = prev.filter((e) => e._id !== id);
            persistProviders(next);
            return next;
        });
        setExpandedProviderId((current) => (current === id ? null : current));
    }, [persistProviders]);

    // Insert a copy named "{name} (copy)" directly below the source and expand it.
    const handleDuplicateProvider = useCallback((id: string) => {
        const copyId = createProviderId();
        setCustomProviders((prev) => {
            const index = prev.findIndex((e) => e._id === id);
            if (index === -1) return prev;
            const source = prev[index].model;
            const copy: CustomChatModel = {
                ...source,
                name: settingsText("{title} (copy)", { title: source.name?.trim() || uiText("Untitled provider") }),
            };
            const next = [...prev];
            next.splice(index + 1, 0, { _id: copyId, model: copy });
            persistProviders(next);
            return next;
        });
        setExpandedProviderId(copyId);
    }, [persistProviders]);

    const handleToggleExpand = useCallback((id: string) => {
        setExpandedProviderId((current) => (current === id ? null : id));
    }, []);

    return (
        <>
            {/* Local Mode */}
            <SectionLabel>{settingsText("Local Mode")}</SectionLabel>
            <SettingsGroup className="bg-senary">
                <SettingsRow
                    title={settingsText("Run entirely on this device")}
                    description={localModeToggle.description}
                    announceDescription={restartNeeded}
                    control={
                        <input
                            type="checkbox"
                            aria-label={settingsText("Run entirely on this device")}
                            checked={localModeToggle.checked}
                            disabled={localModeToggle.disabled}
                            onChange={(e) => handleLocalModeToggle(e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    }
                />
                {showLocalRoundCap(localModePref, localModeActive) && (
                    <SettingsRow
                        hasBorder
                        title={settingsText("Round cap")}
                        description={localRoundCapDescription()}
                        control={
                            <input
                                type="text"
                                inputMode="numeric"
                                value={maxRoundsText}
                                onChange={(e) => handleMaxRoundsChange(e.target.value)}
                                placeholder={String(DEFAULT_MAX_ROUNDS)}
                                aria-label={settingsText("Maximum tool-calling rounds")}
                                className="chat-input text-base font-color-primary"
                                style={{ width: '80px', textAlign: 'right' }}
                            />
                        }
                    />
                )}
                {localModeActive && (
                    <SettingsRow
                        hasBorder
                        className="items-start"
                        announceDescription
                        title={settingsText("Status")}
                        description={
                            <span className={localStatus.ok ? 'font-color-green' : 'font-color-error'}>
                                {localStatus.ok
                                    ? settingsText("Ready — using “{model}”.", { model: localStatus.config.model.name })
                                    : localConfigErrorText(localStatus.reason)}
                            </span>
                        }
                    />
                )}
            </SettingsGroup>

            {/* Search — local-mode only; these prefs do nothing in cloud mode. */}
            {localModeActive && (
                <>
                    <SectionLabel>{uiText("Search")}</SectionLabel>
                    <SettingsGroup className="bg-senary">
                        <SettingsRow
                            title={settingsText("Scholarly search")}
                            description={settingsText("Let the model look up published research beyond your library. Its search query is sent to OpenAlex and Semantic Scholar.")}
                            control={
                                <input
                                    type="checkbox"
                                    aria-label={settingsText("Scholarly search")}
                                    checked={scholarlySearchPref}
                                    onChange={(e) => handleScholarlySearchToggle(e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            }
                        />
                        <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                            <div className="text-sm font-color-secondary mb-1">
                                {settingsText("An OpenAlex key raises your search allowance and lets AsterMargin try a cached open-access PDF if Zotero cannot fetch one. Downloads use your OpenAlex allowance.")}
                            </div>
                            <ApiKeyInput
                                id="openalex-key"
                                label={settingsText("OpenAlex API key")}
                                verify={false}
                                value={openAlexKey}
                                onChange={setOpenAlexKey}
                                savePref={(newValue) => handlePrefSave('openAlexApiKey', newValue)}
                                placeholder={settingsText("Optional")}
                                linkUrl="https://openalex.org/settings/api"
                            />
                        </div>
                        <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                            <div className="text-sm font-color-secondary mb-1">
                                {settingsText("Optional. Raises Semantic Scholar's shared rate limit for these requests.")}
                            </div>
                            <ApiKeyInput
                                id="semantic-scholar-key"
                                label={settingsText("Semantic Scholar API key")}
                                verify={false}
                                value={semanticScholarKey}
                                onChange={setSemanticScholarKey}
                                savePref={(newValue) => handlePrefSave('semanticScholarApiKey', newValue)}
                                placeholder={settingsText("Optional")}
                                linkUrl="https://www.semanticscholar.org/product/api"
                            />
                        </div>
                        <SettingsRow
                            hasBorder
                            title={settingsText("Web search")}
                            description={localWebSearchDescription(localWebSearchStatus.kind, localWebSearchStatus.hostUnconfirmed)}
                            control={
                                <input
                                    type="checkbox"
                                    aria-label={settingsText("Web search")}
                                    checked={webSearchPref}
                                    onChange={(e) => handleWebSearchToggle(e.target.checked)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            }
                        />
                        <SettingsRow
                            hasBorder
                            title={settingsText("Max searches per request")}
                            description={localWebSearchMaxUsesDescription()}
                            control={
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={maxUsesText}
                                    onChange={(e) => handleMaxUsesChange(e.target.value)}
                                    placeholder={String(DEFAULT_LOCAL_WEB_SEARCH_MAX_USES)}
                                    aria-label={settingsText("Max searches per request")}
                                    className="chat-input text-base font-color-primary"
                                    style={{ width: '80px', textAlign: 'right' }}
                                />
                            }
                        />
                    </SettingsGroup>
                </>
            )}

            <SectionDescription>
                {localModeActive ? (
                    <>
                        {settingsText("Connect your own local or self-hosted model below. Requests go straight from this device to your endpoint — AsterMargin's backend is not involved.")}
                    </>
                ) : (
                    <>
                        {settingsText("Connect your own API keys or add a custom endpoint. Keys with higher rate limits (Tier 2 or above) work best.")}
                        {' '}<DocLink path="api-key">{settingsText("API key setup guide")}</DocLink>
                        {' · '}<DocLink path="custom-models">{settingsText("Custom endpoint setup guide")}</DocLink>
                    </>
                )}
            </SectionDescription>

            {/* API Keys */}
            {!localModeActive && (
            <SettingsGroup className="bg-senary">
                <div style={{ padding: '8px 12px' }}>
                    <ApiKeyInput
                        id="gemini-key"
                        label={uiText("Google API Key")}
                        provider="google"
                        value={geminiKey}
                        onChange={setGeminiKey}
                        savePref={(newValue) => handlePrefSave('googleGenerativeAiApiKey', newValue)}
                        placeholder={settingsText("Enter your Google AI Studio API Key")}
                        linkUrl="https://aistudio.google.com/app/apikey"
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <ApiKeyInput
                        id="openai-key"
                        label={uiText("OpenAI API Key")}
                        provider="openai"
                        value={openaiKey}
                        onChange={setOpenaiKey}
                        savePref={(newValue) => handlePrefSave('openAiApiKey', newValue)}
                        placeholder={settingsText("Enter your OpenAI API Key")}
                        linkUrl="https://platform.openai.com/api-keys"
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <ApiKeyInput
                        id="anthropic-key"
                        label={uiText("Anthropic API Key")}
                        provider="anthropic"
                        value={anthropicKey}
                        onChange={setAnthropicKey}
                        savePref={(newValue) => handlePrefSave('anthropicApiKey', newValue)}
                        placeholder={settingsText("Enter your Anthropic API Key")}
                        linkUrl="https://console.anthropic.com/settings/keys"
                    />
                </div>
            </SettingsGroup>
            )}

            {!localModeActive && <PlusToolsSection />}

            {/* Custom Providers */}
            <div>
                <div className="display-flex flex-row items-end justify-between">
                    <SectionLabel>{uiText("Custom Providers")}</SectionLabel>
                    <Button
                        variant="outline"
                        icon={PlusSignIcon}
                        className="text-base mb-15"
                        onClick={handleAddProvider}
                        style={{ padding: '4px 6px' }}
                    >
                        {uiText("Add Provider")}
                    </Button>
                </div>

                <div className="text-base font-color-secondary mb-2" style={{ paddingLeft: '2px' }}>
                    {localModeActive ? (
                        <>
                            {settingsText("OpenRouter, OpenAI-compatible proxies, or a local server such as Ollama or LM Studio. Requests go straight from this device to the endpoint.")}
                        </>
                    ) : (
                        <>
                            {settingsText("OpenRouter, OpenAI-compatible proxies, or self-hosted HTTPS endpoints. Requests are routed through AsterMargin's server. Each endpoint must be reachable from the public internet over HTTPS.")}
                        </>
                    )}
                    {' '}<DocLink path="custom-models">{settingsText("Learn more")}</DocLink>
                </div>

                <div
                    className="display-flex flex-row items-start gap-2 rounded-md px-2 py-15 text-base mb-2"
                    style={{ border: '1px solid var(--tag-orange-tertiary)', background: 'var(--tag-orange-quinary)' }}
                >
                    <Icon icon={AlertIcon} className="flex-shrink-0 mt-020 stroke-width-2" style={{ color: 'var(--tag-orange-secondary)' }} />
                    <span style={{ color: 'var(--tag-orange)' }} >
                        <span className="font-medium">{settingsText("Choose a capable model.")}</span>
                        {' '}{settingsText("AsterMargin plans, calls tools, and reads long documents. Choose a model with an Artificial Analysis score of at least 26, preferably 35 or higher.")}
                        {' '}<ExternalLink href={INTELLIGENCE_INDEX_URL}>{settingsText("Artificial Analysis Intelligence Index")}</ExternalLink>
                    </span>
                </div>

                {customProviders.length > 0 ? (
                    <div className="display-flex flex-col" style={{ gap: '4px' }}>
                        {customProviders.map((entry) => (
                            <CustomProviderCard
                                key={entry._id}
                                model={entry.model}
                                onChange={(model) => handleProviderChange(entry._id, model)}
                                onRemove={() => handleRemoveProvider(entry._id)}
                                onDuplicate={() => handleDuplicateProvider(entry._id)}
                                isExpanded={entry._id === expandedProviderId}
                                onToggleExpand={() => handleToggleExpand(entry._id)}
                                autoFocusName={entry._id === autoFocusProviderId}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-base font-color-tertiary" style={{ paddingLeft: '2px' }}>
                        {settingsText("Select Add Provider to add custom endpoints.")}
                    </div>
                )}
            </div>

        </>
    );
};

export default ApiKeysSection;
