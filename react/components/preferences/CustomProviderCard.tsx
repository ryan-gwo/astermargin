import { knownSettingsText, settingsText } from "../../utils/settingsText";
import { uiText } from "../../utils/interfaceText";
import {checkModelCapabilities} from "./modelCapabilities";
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import Button from "@astermargin/agent-ui/primitives/Button";
import CopyButton from "../ui/buttons/CopyButton";
import MenuButton from "@astermargin/agent-ui/primitives/MenuButton";
import Spinner from "@astermargin/agent-ui/icons/Spinner";
import { MenuItem } from "@astermargin/agent-ui/primitives/ContextMenu";
import {
    Icon,
    ArrowDownIcon,
    TickIcon,
    AlertIcon,
    DeleteIcon,
    CopyIcon,
    RockIcon,
    TissuePaperIcon,
    ScissorIcon,
} from "../icons/icons";
import {
    CUSTOM_MODEL_FORMAT_LABELS,
    CustomChatModel,
    CustomModelFormat,
    customEndpointFormatHint,
    isOpenRouterApiBase,
    normalizeCustomModelFormat,
    validateProviderApiBase,
} from "../../types/settings";
import { DocLink, ExternalLink, INTELLIGENCE_INDEX_URL, SettingsStatus, SettingsSwitch } from "./components/SettingsElements";
import {
    chatService,
    RockPaperScissorsMove,
    RockPaperScissorsTestResult,
} from "@astermargin/agent-core/transport/clients/chatService";
import { localModeEnabledAtom } from "../../atoms/localMode";
import { isLoopbackEndpoint } from "@astermargin/agent-local/config/localAgentConfig";
import { discoverLocalModels, plainHttpWarning, testLocalEndpoint } from "./localProviderTest";
import { LocalProviderTestRunner } from "./localProviderTestRunner";

interface CustomProviderCardProps {
    model: CustomChatModel;
    onChange: (updated: CustomChatModel) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    /** Focus the Name field once on mount (used for newly added providers). */
    autoFocusName?: boolean;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

const MOVES: RockPaperScissorsMove[] = ['rock', 'paper', 'scissors'];

const MOVE_ICONS: Record<RockPaperScissorsMove, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    rock: RockIcon,
    paper: TissuePaperIcon,
    scissors: ScissorIcon,
};

const MOVE_LABELS: Record<RockPaperScissorsMove, string> = {
    rock: 'Rock',
    paper: 'Paper',
    scissors: 'Scissors',
};

const outcomeText = (result: RockPaperScissorsTestResult): string => {
    switch (result.result) {
        case 'user': return 'You win!';
        case 'agent': return 'The model wins.';
        case 'tie': return "It's a tie.";
        default: return '';
    }
};

const CustomProviderCard: React.FC<CustomProviderCardProps> = ({
    model,
    onChange,
    onRemove,
    onDuplicate,
    isExpanded,
    onToggleExpand,
    autoFocusName = false,
}) => {
    const localMode = useAtomValue(localModeEnabledAtom);
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testResult, setTestResult] = useState<RockPaperScissorsTestResult | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    const [localTestMessage, setLocalTestMessage] = useState<string | null>(null);
    const [testingCapabilities, setTestingCapabilities] = useState(false);
    const [discoveringModels, setDiscoveringModels] = useState(false);
    const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
    const [contextWindowText, setContextWindowText] = useState<string>(
        model.context_window != null ? String(model.context_window) : ''
    );
    const nameInputRef = useRef<HTMLInputElement>(null);
    const testRunnerRef = useRef<LocalProviderTestRunner | null>(null);
    if (!testRunnerRef.current) testRunnerRef.current = new LocalProviderTestRunner();

    // Focus the Name field when a newly added provider mounts in its expanded state.
    useEffect(() => {
        if (autoFocusName) {
            nameInputRef.current?.focus();
        }
    }, [autoFocusName]);

    // Abort any in-flight local test on unmount so it can't set state afterward.
    useEffect(() => {
        return () => testRunnerRef.current?.dispose();
    }, []);

    // --- Field updates (controlled by parent) ---
    const update = useCallback((patch: Partial<CustomChatModel>) => {
        onChange({ ...model, ...patch });
    }, [model, onChange]);

    // Context window is free text so it can be cleared/typed; only digits are valid.
    const contextWindowError = contextWindowText.trim() !== '' && !/^\d+$/.test(contextWindowText.trim());
    const handleContextWindowChange = useCallback((raw: string) => {
        setContextWindowText(raw);
        const trimmed = raw.trim();
        if (trimmed === '') {
            update({ context_window: undefined });
        } else if (/^\d+$/.test(trimmed)) {
            update({ context_window: parseInt(trimmed, 10) });
        } else {
            // Invalid input: keep the text visible for correction, but don't persist a bad value.
            update({ context_window: undefined });
        }
    }, [update]);

    // --- Validation (mirrors the backend security checks; local mode also
    // allows http/localhost/private hosts since the request never leaves the
    // user's machine) ---
    const apiBaseValidation = useMemo(
        () => validateProviderApiBase(model.api_base, { allowLocalEndpoints: localMode }),
        [model.api_base, localMode],
    );
    const format = normalizeCustomModelFormat(model.format);
    const formatHint = apiBaseValidation.valid ? customEndpointFormatHint(model.api_base, format) : null;
    const isOpenRouter = isOpenRouterApiBase(model.api_base);
    const hasName = !!model.name?.trim();
    const hasSnapshot = !!model.snapshot?.trim();
    const hasApiKey = !!model.api_key?.trim();
    // Local mode lets a server on this machine run without a key.
    const apiKeyOptional = localMode && isLoopbackEndpoint(model.api_base);
    const isComplete = hasName && hasSnapshot && (hasApiKey || apiKeyOptional) && apiBaseValidation.valid;
    const httpWarning = localMode && apiBaseValidation.valid ? plainHttpWarning(model.api_base) : null;

    // --- Test endpoint (hosted: rock-paper-scissors through the backend) ---
    const runTest = useCallback(async (userMove: RockPaperScissorsMove) => {
        setTestStatus('loading');
        setTestResult(null);
        setTestError(null);
        try {
            const result = await chatService.testCustomProviderRockPaperScissors(
                {
                    api_base: model.api_base?.trim() || undefined,
                    format,
                    api_key: model.api_key?.trim() ?? '',
                    name: model.name?.trim() ?? '',
                    snapshot: model.snapshot?.trim() ?? '',
                    context_window: model.context_window,
                    supports_vision: model.supports_vision,
                },
                userMove,
            );
            setTestResult(result);
            if (result.provider_works) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
                setTestError(result.error_message || settingsText("The provider test failed."));
            }
        } catch (error) {
            setTestStatus('error');
            setTestError(error instanceof Error ? error.message : settingsText("The provider test failed."));
        }
    }, [model, format]);

    // --- Test endpoint (local mode: talk to the provider directly, no backend hop) ---
    const runLocalTest = useCallback(async () => {
        setTestingCapabilities(false);
        // Cancel a prior in-flight test (and stop applying its result) before starting this one.
        const signal = testRunnerRef.current!.start();
        setTestStatus('loading');
        setLocalTestMessage(null);
        setTestError(null);
        // Resolved like a chat run's model, so the test and a chat agree.
        const result = await testLocalEndpoint(
            {
                provider: model.provider,
                api_base: model.api_base?.trim() || undefined,
                format: normalizeCustomModelFormat(model.format),
                api_key: model.api_key?.trim() ?? '',
                name: model.name?.trim() ?? '',
                snapshot: model.snapshot?.trim() ?? '',
                context_window: model.context_window,
                supports_vision: model.supports_vision,
            },
            signal,
        );
        // Discard a result that arrived after unmount or after a newer test superseded this one.
        if (!testRunnerRef.current!.isCurrent(signal)) return;
        if (result.ok) {
            setLocalTestMessage(result.message);
            setTestStatus('success');
        } else if (result.cancelled) {
            // User-initiated cancellation, not a provider failure — don't show it as an error.
            setTestStatus('idle');
        } else {
            setTestStatus('error');
            setTestError(result.message);
        }
    }, [model]);

    const runCapabilitiesTest = async (document: Document) => {
        setTestingCapabilities(true);
        setTestError(null);
        setLocalTestMessage(null);
        setTestStatus("loading");

        const runner = testRunnerRef.current!;
        const signal = runner.start();
        const deadline = new AbortController();
        const abort = () => deadline.abort();
        signal.addEventListener("abort", abort);
        const timer = setTimeout(abort, 60_000);
        try {
            const report = await checkModelCapabilities(model, deadline.signal, document);
            if (!runner.isCurrent(signal)) return;
            setLocalTestMessage(report);
            setTestStatus("success");
        } catch (error) {
            if (!runner.isCurrent(signal)) return;
            setTestError(error instanceof Error ? error.message : String(error));
            setTestStatus("error");
        } finally {
            clearTimeout(timer);
            signal.removeEventListener("abort", abort);
        }
    };

    const discoverModels = useCallback(async () => {
        setDiscoveringModels(true);
        setTestError(null);
        try {
            const models = await discoverLocalModels(model);
            setDiscoveredModels(models);
            if (models.length === 1) update({ snapshot: models[0] });
        } catch (error) {
            setTestError(error instanceof Error ? error.message : String(error));
        } finally {
            setDiscoveringModels(false);
        }
    }, [model, update]);

    const localizedTestError = testError ? knownSettingsText(testError) : null;
    const testMenuItems: MenuItem[] = useMemo(() => [
        { label: '', isDivider: true, onClick: () => {} },
        ...MOVES.map((move) => ({
            label: MOVE_LABELS[move],
            icon: MOVE_ICONS[move],
            onClick: () => runTest(move),
            disabled: !isComplete || testStatus === 'loading',
        })),
    ], [runTest, isComplete, testStatus]);

    const testMenuHeader = (
        <div className="display-flex flex-col gap-05 px-2 py-1 font-color-secondary text-base">
            <span className="font-semibold">Rock Paper Scissors</span>
            <span>Pick a move to test the endpoint</span>
        </div>
    );

    const testButtonCustomContent = (
        <span className="display-flex flex-row items-center gap-2">
            {testStatus === 'loading' ? <Spinner /> : testStatus === 'success' ? (
                <Icon icon={TickIcon} className="font-color-green" />
            ) : null}
            <span>{settingsText("Test Endpoint")}</span>
            <Icon icon={ArrowDownIcon} />
        </span>
    );

    const formatMenuItems: MenuItem[] = (['openai', 'openai_responses', 'anthropic', 'gemini'] as CustomModelFormat[]).map(
        (value) => ({ label: CUSTOM_MODEL_FORMAT_LABELS[value], onClick: () => update({ format: value }) }),
    );

    // --- Collapsed view ---
    if (!isExpanded) {
        return (
            <div
                className="action-card display-flex flex-row items-center gap-3"
                onClick={onToggleExpand}
            >
                <div className="display-flex flex-col flex-1 min-w-0" style={{ gap: '3px' }}>
                    <div className="display-flex flex-row items-center gap-3">
                        <div className="font-color-primary text-base font-medium">
                            {model.name?.trim() || <span className="font-color-tertiary">{uiText("Untitled provider")}</span>}
                        </div>
                        {model.snapshot?.trim() && (
                            <div className="font-color-secondary text-base action-card-preview">
                                {model.snapshot}
                            </div>
                        )}
                        {!isComplete && (
                            <span
                                className="scale-90 px-15 py-05 text-sm rounded-md"
                                style={{ color: 'var(--tag-orange-secondary)', border: '1px solid var(--tag-orange-tertiary)', background: 'var(--tag-orange-quinary)' }}
                            >
                                {settingsText("Incomplete")}
                            </span>
                        )}
                    </div>
                </div>
                <Icon icon={ArrowDownIcon} className="font-color-tertiary flex-shrink-0" />
            </div>
        );
    }

    // --- Expanded view ---
    return (
        // Reuses `.action-card-editing` only to drop the pointer cursor / hover
        // background; that class zeroes padding for ActionCard's full-width header
        // layout, so restore card padding inline (this card has no header/body).
        <div className="action-card action-card-editing" style={{ padding: '10px 12px' }}>
            <div className="display-flex flex-col" style={{ gap: '14px' }}>
                {/* Name */}
                <label className="display-flex flex-col">
                    <span className="text-sm font-color-secondary">{uiText("Name")}</span>
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={model.name}
                        onChange={(e) => update({ name: e.target.value })}
                        placeholder={settingsText("My Custom Model")}
                        aria-label={settingsText("Provider name")}
                        className="chat-input text-base font-color-primary"
                    />
                </label>

                {/* Snapshot */}
                <label className="display-flex flex-col">
                    <span className="text-sm font-color-secondary">{uiText("Model (snapshot)")}</span>
                    <div className="display-flex flex-row gap-2">
                        <input
                            type="text"
                            value={model.snapshot}
                            onChange={(e) => update({ snapshot: e.target.value })}
                            placeholder="openai/gpt-4o"
                            aria-label={settingsText("Model snapshot")}
                            className="chat-input text-base font-color-primary flex-1 min-w-0"
                        />
                        {localMode && (
                            <Button variant="outline" onClick={() => void discoverModels()} disabled={discoveringModels} loading={discoveringModels} style={{ padding: '4px 6px' }}>
                                {settingsText("List models")}
                            </Button>
                        )}
                    </div>
                    {discoveredModels.length > 0 && (
                        <select
                            className="preference-input text-base mt-1"
                            value={discoveredModels.includes(model.snapshot) ? model.snapshot : ''}
                            onChange={(event) => update({ snapshot: event.target.value })}
                            aria-label={settingsText("Discovered models")}
                        >
                            <option value="">{settingsText("Choose a discovered model")}</option>
                            {discoveredModels.map((id) => <option key={id} value={id}>{id}</option>)}
                        </select>
                    )}
                    <span className="text-sm font-color-tertiary">
                        {settingsText("Small or older models may struggle with tool calls. Choose a model with an Artificial Analysis score of at least 26, preferably 35 or higher.")}
                        {' '}<ExternalLink href={INTELLIGENCE_INDEX_URL}>{settingsText("Artificial Analysis Intelligence Index")}</ExternalLink>
                    </span>
                </label>

                {/* API base */}
                <label className="display-flex flex-col">
                    <span className="text-sm font-color-secondary">{uiText("Endpoint URL (api_base)")}</span>
                    <input
                        type="text"
                        value={model.api_base ?? ''}
                        onChange={(e) => update({ api_base: e.target.value })}
                        placeholder="https://openrouter.ai/api/v1"
                        aria-label={settingsText("Endpoint URL")}
                        className="chat-input text-base font-color-primary"
                    />
                    {model.api_base?.trim() && !apiBaseValidation.valid && (
                        <span className="display-flex flex-row items-start text-sm font-color-error">
                            <Icon icon={AlertIcon} className="flex-shrink-0 mt-020 mr-1" />
                            <span>
                                {knownSettingsText(apiBaseValidation.error ?? "")}
                                {!localMode && (
                                    <>
                                        {' '}
                                        <DocLink path="custom-models">{settingsText("Network requirements")}</DocLink>
                                    </>
                                )}
                            </span>
                        </span>
                    )}
                    {(formatHint || httpWarning) && (
                        <span className="display-flex flex-row items-start text-sm" style={{ color: 'var(--tag-orange-secondary)' }}>
                            <Icon icon={AlertIcon} className="flex-shrink-0 mt-020 mr-1" />
                            <span>{knownSettingsText((formatHint || httpWarning)!)}</span>
                        </span>
                    )}
                </label>

                {/* Format + Context window row */}
                <div className="display-flex flex-col gap-1">
                    <div className="display-flex flex-row gap-4">
                        {/* Not a <label>: the menu renders inside this wrapper, and a label
                            forwards clicks on its menu items to the button, reopening the menu. */}
                        <div className="display-flex flex-col items-start">
                            <span className="text-sm font-color-secondary">{uiText("Format")}</span>
                            <MenuButton
                                menuItems={formatMenuItems}
                                buttonLabel={CUSTOM_MODEL_FORMAT_LABELS[format]}
                                variant="outline"
                                rightIcon={ArrowDownIcon}
                                width="210px"
                                className="text-base"
                                ariaLabel={settingsText("API format")}
                                disabled={isOpenRouter}
                            />
                        </div>
                        <label className="display-flex flex-col flex-1">
                            <span className="text-sm font-color-secondary">{uiText("Context window")}</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={contextWindowText}
                                onChange={(e) => handleContextWindowChange(e.target.value)}
                                placeholder="128000"
                                aria-label={uiText("Context window")}
                                className="chat-input text-base font-color-primary"
                            />
                            {contextWindowError && (
                                <span className="text-sm" style={{ color: 'var(--tag-red-secondary)' }}>
                                    {settingsText("Enter a number (e.g. 128000).")}
                                </span>
                            )}
                        </label>
                    </div>
                    {isOpenRouter && (
                        <span className="text-sm font-color-tertiary">
                            {settingsText("OpenRouter uses AsterMargin's built-in OpenRouter connection, so Format does not apply.")}
                        </span>
                    )}
                </div>

                <label className="display-flex flex-col">
                    <span className="text-sm font-color-secondary">{settingsText("Reasoning strength")}</span>
                    <select
                        value={model.reasoning_effort ?? ''}
                        onChange={(event) => update({
                            reasoning_effort: event.target.value === 'low' || event.target.value === 'medium' || event.target.value === 'high'
                                ? event.target.value
                                : undefined,
                        })}
                        aria-label={settingsText("Reasoning strength")}
                        className="preference-input text-base font-color-primary"
                    >
                        <option value="">{settingsText("Service default")}</option>
                        <option value="low">{settingsText("Low")}</option>
                        <option value="medium">{settingsText("Medium")}</option>
                        <option value="high">{settingsText("High")}</option>
                    </select>
                    <span className="text-sm font-color-tertiary">
                        {settingsText("Leave this at service default unless the endpoint documents a supported level. The server decides the effective setting.")}
                    </span>
                </label>

                {/* API key. The copy button is required: Gecko's built-in reveal button
                    unmasks a password input without changing its type, and clipboard
                    copy stays blocked for as long as the input is type="password". */}
                <label className="display-flex flex-col">
                    <span className="text-sm font-color-secondary">{uiText("API key")}</span>
                    <div className="display-flex flex-row items-center gap-2">
                        <input
                            type="password"
                            value={model.api_key}
                            onChange={(e) => update({ api_key: e.target.value })}
                            placeholder={apiKeyOptional ? settingsText("Optional for a server on this computer") : "sk-..."}
                            aria-label={uiText("API key")}
                            className="chat-input text-base font-color-primary flex-1 min-w-0"
                        />
                        {hasApiKey && (
                            <CopyButton
                                content={model.api_key}
                                ariaLabel={settingsText("Copy API key")}
                                title={settingsText("Copy API key")}
                                className="scale-11 p-0 flex-shrink-0"
                            />
                        )}
                    </div>
                </label>

                {/* Supports vision */}
                <label className="display-flex flex-row items-center gap-1 cursor-pointer">
                    <SettingsSwitch
                        checked={!!model.supports_vision}
                        onChange={(checked) => update({ supports_vision: checked })}
                        aria-label={uiText("Supports vision (image input)")}
                    />
                    <span className="text-base font-color-primary">{uiText("Supports vision (image input)")}</span>
                </label>

                {localMode && (
                    <button
                        type="button"
                        disabled={!isComplete || testStatus === "loading"}
                        onClick={(event) => void runCapabilitiesTest(event.currentTarget.ownerDocument)}
                    >
                        {settingsText("Test streaming, tools and vision (3 requests)")}
                    </button>
                )}
                {/* Footer actions */}
                <div className="display-flex flex-row items-center justify-between mt-1">
                    {localMode ? (
                        <Button
                            variant="outline"
                            icon={testStatus === "success" && !testingCapabilities ? TickIcon : undefined}
                            onClick={runLocalTest}
                            style={{ padding: '4px 6px' }}
                            disabled={(!isComplete && testStatus !== 'loading') || testStatus === 'loading'}
                            title={!isComplete ? settingsText("Fill in all required fields to test the endpoint.") : undefined}
                            loading={testStatus === 'loading'}
                            loadingText={settingsText("Testing...")}
                        >
                            {settingsText("Test Endpoint")}
                        </Button>
                    ) : (
                        <MenuButton
                            menuItems={testMenuItems}
                            header={testMenuHeader}
                            customContent={testButtonCustomContent}
                            variant="outline"
                            width="220px"
                            className="text-base"
                            style={{ padding: '4px 6px' }}
                            ariaLabel={settingsText("Test endpoint")}
                            disabled={!isComplete && testStatus !== 'loading'}
                            tooltipContent={!isComplete ? settingsText("Fill in all required fields to test the endpoint.") : undefined}
                        />
                    )}
                    <div className="display-flex flex-row items-center gap-3">
                        <Button
                            variant="outline"
                            icon={CopyIcon}
                            onClick={onDuplicate}
                            style={{ padding: '4px 6px' }}
                        >
                            {settingsText("Duplicate")}
                        </Button>
                        <Button
                            variant="outline"
                            icon={DeleteIcon}
                            onClick={onRemove}
                            style={{ padding: '4px 6px' }}
                        >
                            {settingsText("Delete")}
                        </Button>
                        <Button
                            variant="solid"
                            onClick={onToggleExpand}
                            style={{ padding: '4px 6px' }}
                        >
                            {settingsText("Done")}
                        </Button>
                    </div>
                </div>

                {/* Test result (shown below the Test button) */}
                {localMode && testStatus === 'success' && (
                    <div
                        className="display-flex flex-col gap-1 rounded-md px-2 py-15 text-base"
                        style={{ border: '1px solid var(--tag-green-tertiary)', background: 'var(--tag-green-quinary)' }}
                    >
                        <div className="display-flex flex-row items-center gap-2 font-color-primary">
                            <Icon icon={TickIcon} className="font-color-green" />
                            <span className="font-medium">{testingCapabilities ? settingsText("Capability test results") : uiText("Endpoint works")}</span>
                        </div>
                        {localTestMessage && (
                            <div className="font-color-secondary" style={{ fontStyle: 'italic' }}>
                                “{knownSettingsText(localTestMessage)}”
                            </div>
                        )}
                    </div>
                )}
                {!localMode && testStatus === 'success' && testResult && (
                    <div
                        className="display-flex flex-col gap-1 rounded-md px-2 py-15 text-base"
                        style={{ border: '1px solid var(--tag-green-tertiary)', background: 'var(--tag-green-quinary)' }}
                    >
                        <div className="display-flex flex-row items-center gap-2 font-color-primary">
                            <Icon icon={TickIcon} className="font-color-green" />
                            <span className="font-medium">{uiText("Endpoint works")}</span>
                            {testResult.user_move && testResult.agent_move && (
                                <span className="display-flex flex-row items-center gap-1 font-color-secondary">
                                    <span title={`You: ${MOVE_LABELS[testResult.user_move]}`}>
                                        <Icon icon={MOVE_ICONS[testResult.user_move]} />
                                    </span>
                                    <span>vs</span>
                                    <span title={`Model: ${MOVE_LABELS[testResult.agent_move]}`}>
                                        <Icon icon={MOVE_ICONS[testResult.agent_move]} />
                                    </span>
                                    <span>· {outcomeText(testResult)}</span>
                                </span>
                            )}
                        </div>
                        {testResult.agent_message && (
                            <div className="font-color-secondary" style={{ fontStyle: 'italic' }}>
                                “{testResult.agent_message}”
                            </div>
                        )}
                    </div>
                )}
                {testStatus === 'error' && testError && (
                    <div
                        className="display-flex flex-row items-start gap-2 rounded-md px-2 py-15 text-sm"
                        style={{ border: '1px solid var(--tag-red-tertiary)', background: 'var(--tag-red-quinary)', color: 'var(--tag-red-secondary)' }}
                    >
                        <Icon icon={AlertIcon} className="flex-shrink-0 mt-020" />
                        {localizedTestError === testError && localMode
                            ? <SettingsStatus value={{ message: settingsText("The provider test failed."), detail: testError }} />
                            : <span>{localizedTestError}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomProviderCard;
