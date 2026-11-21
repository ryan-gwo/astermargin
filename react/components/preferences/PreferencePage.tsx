import { settingsText } from "../../utils/settingsText";
import { uiText } from "../../utils/interfaceText";
import { usePreference } from '../../hooks/usePreference';
import React, { useState, useCallback, useMemo } from "react";
import { useAtom, useAtomValue } from 'jotai';
import { logoutAtom, userAtom } from '../../atoms/auth';
import { getPref, setPref } from '../../../src/utils/prefs';
import { UserIcon, LogoutIcon, SettingsIcon, Icon, SearchIcon, LockIcon, KeyIcon, ZapIcon, ToolsIcon, DollarCircleIcon } from '../icons/icons';
import { useSetAtom } from 'jotai';
import { runStatusPopupEnabledAtom } from '../../atoms/runStatusPopup';
import { profileWithPlanAtom, creditPlanAtom, hasCreditPlanAtom } from "../../atoms/profile";
import { activePreferencePageTabAtom } from "../../atoms/ui";
import { logger } from "@astermargin/agent-core/platform/logger";
import { isDiffPreviewSupported } from "../../utils/noteEditorDiffPreview";
import { accountService } from "@astermargin/agent-core/transport/clients/accountService";
import {SettingsGroup, SettingsRow, SectionLabel, PageHeader} from "./components/SettingsElements";
import ActionsPreferenceSection from "./ActionsPreferenceSection";
import BillingSection, { formatPlanName } from "./BillingSection";
import ApiKeysSection from "./ApiKeysSection";
import AdvancedSection from "./AdvancedSection";
import { WebDavSettings } from "./WebDavSettings";
import { OcrSettings } from "./OcrSettings";
import { SemanticSettings } from "./SemanticSettings";
import { ReadingRule } from "./ReadingRule";
import PermissionsSection from "./PermissionsSection";
import LibraryAccessList from "./LibraryAccessList";
import BackgroundProcessingSection from "./BackgroundProcessingSection";
import CloudFeaturesBanner from "./CloudFeaturesBanner";
import { chatLineSpacingAtom, CHAT_LINE_SPACING, type ChatLineSpacing } from '../../atoms/preferences';
import { localModeEnabledAtom } from '../../atoms/localMode';
import { isPreferenceTabVisible, resolvePreferenceTab, type VisiblePreferencePageTab } from './preferenceTabs';

interface PreferenceTabDefinition {
    id: VisiblePreferencePageTab;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    /** The page renders its own title row (e.g. to place buttons next to it). */
    ownsHeader?: boolean;
}

const PreferencePage: React.FC = () => {
    const [user] = useAtom(userAtom);
    const [lineSpacing, setLineSpacing] = useAtom(chatLineSpacingAtom);
    const logout = useSetAtom(logoutAtom);

    // --- User profile ---
    const profileWithPlan = useAtomValue(profileWithPlanAtom);

    // --- State for Preferences ---
    const [citationFormat, setCitationFormat] = usePreference(() => getPref('citationFormat') === 'numeric');
    const [useTemporaryCitationAnnotations, setUseTemporaryCitationAnnotations] = usePreference(() => getPref('useTemporaryCitationAnnotations') === true);
    const [keyboardShortcut, setKeyboardShortcut] = usePreference(() => {
        const shortcut = getPref('keyboardShortcut');
        return /^[a-z]$/i.test(shortcut) ? shortcut.toUpperCase() : 'J';
    });
    const [addSelectedOnNewThread, setAddSelectedOnNewThread] = usePreference(() => getPref('addSelectedItemsOnNewThread'));
    const [addSelectedOnOpen, setAddSelectedOnOpen] = usePreference(() => getPref('addSelectedItemsOnOpen'));
    const [runStatusPopupEnabled, setRunStatusPopupEnabled] = useAtom(runStatusPopupEnabledAtom);
    const [addProvenanceNote, setAddProvenanceNote] = usePreference(() => getPref('addAsterMarginProvenanceNote'));
    const [focusResponseForScreenReaders, setFocusResponseForScreenReaders] = usePreference(() => getPref('focusResponseForScreenReaders'));
    const [showDiffPreview, setShowDiffPreview] = usePreference(() => getPref('showDiffPreviewInNoteEditor') !== false);
    const diffPreviewSupported = isDiffPreviewSupported();
    const [consentToShare, setConsentToShare] = useState(() => profileWithPlan?.consent_to_share || false);
    const [emailNotifications, setEmailNotifications] = useState(() => profileWithPlan?.email_notifications || false);
    const creditPlan = useAtomValue(creditPlanAtom);
    const hasCreditPlan = useAtomValue(hasCreditPlanAtom);
    const [activeTab, setActiveTab] = useAtom(activePreferencePageTabAtom);
    const localMode = useAtomValue(localModeEnabledAtom);

    // Update local state when atom changes
    React.useEffect(() => {
        setConsentToShare(profileWithPlan?.consent_to_share || false);
        setEmailNotifications(profileWithPlan?.email_notifications || false);
    }, [profileWithPlan?.consent_to_share, profileWithPlan?.email_notifications]);
    
    const handleKeyboardShortcutChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextShortcut = event.target.value.toLowerCase();
        if (!/^[a-z]$/.test(nextShortcut)) {
            return;
        }
        setKeyboardShortcut(nextShortcut.toUpperCase());
        if (nextShortcut !== getPref('keyboardShortcut')) {
            setPref('keyboardShortcut', nextShortcut);
            logger(`Updated keyboard shortcut to ${nextShortcut.toUpperCase()}`);
        }
    }, []);

    // --- Consent Toggle Change Handler ---
    const handleConsentChange = useCallback(async (checked: boolean) => {
        const action = checked ? 'enable' : 'disable';
        try {
            logger(`User confirmed to ${action} consent to share. New value: ${checked}`);
            await Zotero.AsterMargin.account?.updatePreference('consent_to_share', checked);

            setConsentToShare(checked);
            logger('Successfully updated consent to share preference.');
        } catch (error) {
            logger(`Failed to update consent to share preference: ${error}`, 1);
            Zotero.logError(error as Error);
            // Revert the toggle on error
            setConsentToShare(!checked);
        }
    }, []);

    // --- Email Notifications Toggle Change Handler ---
    const handleEmailNotificationsChange = useCallback(async (checked: boolean) => {
        const action = checked ? 'enable' : 'disable';
        try {
            logger(`User confirmed to ${action} email notifications. New value: ${checked}`);
            await Zotero.AsterMargin.account?.updatePreference('email_notifications', checked);

            setEmailNotifications(checked);
            logger('Successfully updated email notifications preference.');
        } catch (error) {
            logger(`Failed to update email notifications preference: ${error}`, 1);
            Zotero.logError(error as Error);
            // Revert the toggle on error
            setEmailNotifications(!checked);
        }
    }, []);

    // --- Inline toggle handlers for card-based layout ---
    const handleCitationFormatToggle = useCallback(() => {
        const newChecked = !citationFormat;
        setPref("citationFormat", newChecked ? "numeric" : "author-year");
        setCitationFormat(newChecked);
    }, [citationFormat]);

    const handleTemporaryCitationAnnotationsToggle = useCallback(() => {
        const newValue = !useTemporaryCitationAnnotations;
        setPref("useTemporaryCitationAnnotations", newValue);
        setUseTemporaryCitationAnnotations(newValue);
    }, [useTemporaryCitationAnnotations]);

    const handleAddSelectedOnNewThreadToggle = useCallback(() => {
        const newValue = !addSelectedOnNewThread;
        setPref("addSelectedItemsOnNewThread", newValue);
        setAddSelectedOnNewThread(newValue);
    }, [addSelectedOnNewThread]);

    const handleAddSelectedOnOpenToggle = useCallback(() => {
        const newValue = !addSelectedOnOpen;
        setPref("addSelectedItemsOnOpen", newValue);
        setAddSelectedOnOpen(newValue);
    }, [addSelectedOnOpen]);

    const handleRunStatusPopupToggle = useCallback(() => {
        setRunStatusPopupEnabled(!runStatusPopupEnabled);
    }, [runStatusPopupEnabled, setRunStatusPopupEnabled]);

    const handleAddProvenanceNoteToggle = useCallback(() => {
        const newValue = !addProvenanceNote;
        setPref("addAsterMarginProvenanceNote", newValue);
        setAddProvenanceNote(newValue);
    }, [addProvenanceNote]);

    const handleFocusResponseForScreenReadersToggle = useCallback(() => {
        const newValue = !focusResponseForScreenReaders;
        setPref("focusResponseForScreenReaders", newValue);
        setFocusResponseForScreenReaders(newValue);
    }, [focusResponseForScreenReaders]);

    const handleShowDiffPreviewToggle = useCallback(() => {
        if (!diffPreviewSupported) return;
        const newValue = !showDiffPreview;
        setPref("showDiffPreviewInNoteEditor", newValue);
        setShowDiffPreview(newValue);
    }, [showDiffPreview, diffPreviewSupported]);

    const handleConsentToggle = useCallback(() => {
        handleConsentChange(!consentToShare);
    }, [consentToShare, handleConsentChange]);

    const handleEmailToggle = useCallback(() => {
        handleEmailNotificationsChange(!emailNotifications);
    }, [emailNotifications, handleEmailNotificationsChange]);

    const sidebarShortcutLabel = `${Zotero.isMac ? '⌘' : 'Ctrl'}+${keyboardShortcut}`;
    const windowShortcutLabel = `${Zotero.isMac ? '⌘⇧' : 'Ctrl+Shift'}+${keyboardShortcut}`;
    const quickPromptShortcutLabel = `${Zotero.isMac ? '⌘⌥' : 'Ctrl+Alt'}+${keyboardShortcut}`;
    const tabs = useMemo<PreferenceTabDefinition[]>(() => ([
        { id: 'general', label: uiText("General"), icon: SettingsIcon },
        { id: 'sync', label: uiText("Search & Files"), icon: SearchIcon },
        { id: 'permissions', label: uiText("Permissions"), icon: LockIcon },
        { id: 'billing', label: uiText("Plan & Usage"), icon: DollarCircleIcon },
        { id: 'models', label: uiText("API Keys"), icon: KeyIcon },
        { id: 'actions', label: uiText(settingsText("Actions")), icon: ZapIcon, ownsHeader: true },
        { id: 'advanced', label: uiText("Advanced"), icon: ToolsIcon },
    ] as PreferenceTabDefinition[]).filter((tab) => isPreferenceTabVisible(tab.id, localMode)), [localMode]);
    const effectiveActiveTab: VisiblePreferencePageTab = resolvePreferenceTab(activeTab, localMode);
    const activeTabDefinition = tabs.find((tab) => tab.id === effectiveActiveTab) ?? tabs[0];

    // The tab list is vertical: Up/Down move between tabs (wrapping), Home/End jump to the ends.
    const handleTabKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const navigationKeys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (!navigationKeys.includes(event.key)) {
            return;
        }

        event.preventDefault();
        const currentIndex = tabs.findIndex((tab) => tab.id === effectiveActiveTab);
        const normalizedIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : event.key === 'ArrowUp'
                    ? (normalizedIndex - 1 + tabs.length) % tabs.length
                    : (normalizedIndex + 1) % tabs.length;
        const nextTab = tabs[nextIndex];
        setActiveTab(nextTab.id);
        event.currentTarget.ownerDocument
            .getElementById(`astermargin-preferences-tab-${nextTab.id}`)
            ?.focus();
    }, [effectiveActiveTab, setActiveTab, tabs]);

    // Keep the persisted tab in sync with what's actually shown: corrects the
    // legacy "account" alias, and redirects away from a tab hidden in this
    // mode (e.g. a stale "billing" request while running in local mode).
    React.useEffect(() => {
        const resolved = resolvePreferenceTab(activeTab, localMode);
        if (resolved !== activeTab) {
            setActiveTab(resolved);
        }
    }, [activeTab, localMode, setActiveTab]);

    const planLabel = hasCreditPlan ? settingsText("{plan} plan", { plan: formatPlanName(creditPlan.plan ?? undefined) }) : settingsText("No active plan");
    const accountInitial = user?.email?.trim().charAt(0) || '?';

    return (
        <div
            id="astermargin-preferences"
            className="flex-1 min-h-0 min-w-0 display-flex flex-row"
        >
            {/* ===== SIDEBAR: section tabs, account ===== */}
            <div className="astermargin-prefs-sidebar display-flex flex-col flex-shrink-0 min-h-0 border-right-quinary">
                <div
                    role="tablist"
                    aria-label={settingsText("Settings sections")}
                    aria-orientation="vertical"
                    className="display-flex flex-col gap-05 flex-1 min-h-0 overflow-y-auto scrollbar"
                    style={{ padding: '14px 10px 0' }}
                    onKeyDown={handleTabKeyDown}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            id={`astermargin-preferences-tab-${tab.id}`}
                            role="tab"
                            aria-selected={tab.id === effectiveActiveTab}
                            aria-controls="astermargin-preferences-panel"
                            tabIndex={tab.id === effectiveActiveTab ? 0 : -1}
                            className="astermargin-prefs-nav-item"
                        >
                            <Icon icon={tab.icon} aria-hidden="true" focusable="false" />
                            <span className="truncate">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sign out sits with the navigation, below the tabs, so the
                    account block underneath stays a single, quiet control. */}
                {user && (
                    <div style={{ padding: '8px 10px' }}>
                        <button
                            type="button"
                            className="astermargin-prefs-nav-item"
                            onClick={logout}
                            title={settingsText("End your current session")}
                        >
                            <Icon icon={LogoutIcon} aria-hidden="true" focusable="false" />
                            <span className="truncate">{settingsText("Sign out")}</span>
                        </button>
                    </div>
                )}

                {/* Account stays visible whichever section is open; clicking it
                    opens the Plan & Usage page. */}
                <div className="display-flex flex-col border-top-quinary" style={{ padding: '10px 10px 10px' }}>
                    {user ? (
                        <button
                            type="button"
                            className="astermargin-prefs-account"
                            onClick={() => setActiveTab('billing')}
                            title={settingsText("{email} — open Plan & Usage", { email: user.email ?? "" })}
                            aria-label={settingsText("Account {email}, {plan}. Open Plan & Usage", { email: user.email ?? "", plan: planLabel })}
                        >
                            <div className="astermargin-prefs-avatar" aria-hidden="true">{accountInitial}</div>
                            <div className="display-flex flex-col min-w-0" aria-hidden="true">
                                <div className="text-base font-color-primary font-medium truncate">
                                    {user.email}
                                </div>
                                <div className="text-sm font-color-secondary truncate">{planLabel}</div>
                            </div>
                        </button>
                    ) : (
                        <div className="display-flex flex-row items-center gap-2 min-w-0" style={{ padding: '6px 8px' }}>
                            <div className="astermargin-prefs-avatar" aria-hidden="true">
                                <Icon icon={UserIcon} />
                            </div>
                            <div className="text-base font-color-secondary">{settingsText("Not signed in")}</div>
                        </div>
                    )}
                    <div className="astermargin-prefs-legal display-flex flex-row items-center gap-1">
                        <button
                            type="button"
                            onClick={() => Zotero.launchURL(process.env.WEBAPP_BASE_URL + '/terms')}
                            className="text-link-muted text-xs"
                        >
                            {settingsText("Terms of Service")}
                        </button>
                        <span className="font-color-tertiary text-xs" aria-hidden="true">·</span>
                        <button
                            type="button"
                            onClick={() => Zotero.launchURL(process.env.WEBAPP_BASE_URL + '/privacy-policy')}
                            className="text-link-muted text-xs"
                        >
                            {settingsText("Privacy Policy")}
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== CONTENT: the selected section ===== */}
            <div className="astermargin-prefs-content flex-1 min-h-0 min-w-0 overflow-y-auto scrollbar">
                <div
                    role="tabpanel"
                    id="astermargin-preferences-panel"
                    aria-labelledby={`astermargin-preferences-tab-${effectiveActiveTab}`}
                    className="astermargin-prefs-page display-flex flex-col"
                >
                {!activeTabDefinition.ownsHeader && (
                    <PageHeader title={activeTabDefinition.label} />
                )}

                {/* ===== GENERAL TAB ===== */}
                {effectiveActiveTab === 'general' && (
                    <>
                        <SectionLabel>{settingsText("Sidebar")}</SectionLabel>
                        <SettingsGroup>
                            <SettingsRow
                                title={settingsText("Keyboard Shortcut")}
                                description={settingsText("Sidebar: {sidebar} · Window: {window} · Quick prompt: {quick} · Changes require restart", {
                                    sidebar: sidebarShortcutLabel, window: windowShortcutLabel, quick: quickPromptShortcutLabel,
                                })}
                                control={
                                    <select
                                        id="keyboard-shortcut"
                                        aria-label={settingsText("Keyboard Shortcut")}
                                        value={keyboardShortcut}
                                        onChange={handleKeyboardShortcutChange}
                                        className="py-1 px-2 border preference-input text-sm"
                                        style={{ width: '40px', margin: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {'DGHJKMRVX'.split('').map((letter) => (
                                            <option key={letter} value={letter}>{letter}</option>
                                        ))}
                                    </select>
                                }
                            />
                            <SettingsRow
                                title={settingsText("Add Selected Items and Collections to New Threads")}
                                description={settingsText("Automatically attach selected items and collections to new threads")}
                                onClick={handleAddSelectedOnNewThreadToggle}
                                hasBorder
                                tooltip={settingsText("When enabled, selected Zotero items and collections are attached when you start a new conversation, including from the quick prompt.")}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={addSelectedOnNewThread}
                                        onChange={handleAddSelectedOnNewThreadToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                            <SettingsRow
                                title={settingsText("Add Selected Items When Opening")}
                                description={settingsText("Automatically attach selected items when opening AsterMargin")}
                                onClick={handleAddSelectedOnOpenToggle}
                                hasBorder
                                tooltip={settingsText("When enabled, any items you have selected in Zotero will be automatically added as sources when you open AsterMargin.")}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={addSelectedOnOpen}
                                        onChange={handleAddSelectedOnOpenToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                            <SettingsRow
                                title={settingsText("Run Status Popup")}
                                description={settingsText("Show what AsterMargin is doing in the corner of the window while the sidebar is closed")}
                                onClick={handleRunStatusPopupToggle}
                                hasBorder
                                tooltip={settingsText("When enabled, a small card in the bottom-right corner of the Zotero window shows the current run's progress, lets you approve pending changes, and reports when a response is ready.")}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={runStatusPopupEnabled}
                                        onChange={handleRunStatusPopupToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                        </SettingsGroup>

                        <SectionLabel>{settingsText("Citations")}</SectionLabel>
                        <SettingsGroup>
                            <SettingsRow
                                title={settingsText("Citation Format: {format}", { format: settingsText(citationFormat ? "Numeric" : "Author-Year") })}
                                description={settingsText("Choose between numeric [1] or author-year (Smith, 2023) citations")}
                                onClick={handleCitationFormatToggle}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={citationFormat}
                                        onChange={handleCitationFormatToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                            <SettingsRow
                                title={settingsText("Keep Cited Passages Highlighted")}
                                description={settingsText("When enabled, AsterMargin marks cited passages with temporary Zotero annotations that disappear on your next click. When disabled, AsterMargin briefly flashes the passage instead.")}
                                onClick={handleTemporaryCitationAnnotationsToggle}
                                hasBorder
                                tooltip={settingsText("When disabled, citations use Zotero's transient PDF position highlight instead.")}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={useTemporaryCitationAnnotations}
                                        onChange={handleTemporaryCitationAnnotationsToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                        </SettingsGroup>

                        <SectionLabel>{settingsText("Notes")}</SectionLabel>
                        <SettingsGroup>
                            <SettingsRow
                                title={settingsText("Add Provenance Note to Imported Items")}
                                description={settingsText("Add a child note with a conversation link to AsterMargin conversation")}
                                onClick={handleAddProvenanceNoteToggle}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={addProvenanceNote}
                                        onChange={handleAddProvenanceNoteToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                            <SettingsRow
                                title={settingsText("Preview Note Edits in Editor")}
                                description={diffPreviewSupported
                                    ? settingsText("Show proposed note edits inline in the Zotero note editor")
                                    : settingsText("Requires Zotero 8 — unavailable on this version")}
                                onClick={diffPreviewSupported ? handleShowDiffPreviewToggle : undefined}
                                hasBorder
                                tooltip={settingsText("When enabled, edit_note proposals appear as a colored diff directly in the note editor with Apply / Reject controls. When disabled, approvals fall back to the sidebar preview. Turn off if a Zotero update causes the in-editor preview to misbehave.")}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={showDiffPreview && diffPreviewSupported}
                                        disabled={!diffPreviewSupported}
                                        onChange={handleShowDiffPreviewToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: diffPreviewSupported ? 'pointer' : 'not-allowed', margin: 0 }}
                                    />
                                }
                            />
                        </SettingsGroup>

                        <SectionLabel>{settingsText("Accessibility")}</SectionLabel>
                        <SettingsGroup>
                            <SettingsRow
                                title={settingsText("Chat Line Spacing")}
                                description={settingsText("Adjust the space between lines in chat messages")}
                                control={
                                    <select
                                        id="astermargin-chat-line-spacing"
                                        aria-label={settingsText("Chat Line Spacing")}
                                        value={lineSpacing}
                                        onChange={(event) => setLineSpacing(event.target.value as ChatLineSpacing)}
                                        className="py-1 px-2 border preference-input text-sm"
                                        style={{ margin: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {Object.entries(CHAT_LINE_SPACING).map(([value, preset]) => (
                                            <option key={value} value={value}>{settingsText(preset.label)}</option>
                                        ))}
                                    </select>
                                }
                            />
                            <SettingsRow
                                title={settingsText("Announce Responses for Screen Readers")}
                                hasBorder
                                description={settingsText("Move focus to screen-reader text when AsterMargin starts and finishes generating a response")}
                                onClick={handleFocusResponseForScreenReadersToggle}
                                tooltip={settingsText("When enabled, focus moves from the chat input to screen-reader-only status text while AsterMargin generates, then to a screen-reader-only copy of the completed response.")}
                                control={
                                    <input
                                        type="checkbox"
                                        checked={focusResponseForScreenReaders}
                                        onChange={handleFocusResponseForScreenReadersToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                }
                            />
                        </SettingsGroup>

                        {/* These two preferences live on the account, so they are only
                            offered while signed in. */}
                        {user && (
                            <>
                                <SectionLabel>{settingsText("Privacy")}</SectionLabel>
                                <SettingsGroup>
                                    <SettingsRow
                                        title={settingsText("Help Improve AsterMargin")}
                                        description={settingsText("Share anonymized prompts to help improve AsterMargin")}
                                        onClick={handleConsentToggle}
                                        tooltip={settingsText("When enabled, we use your prompts, queries, and AI responses to improve AsterMargin's features and performance. We automatically remove personal information and never share your PDFs, documents, or other files.")}
                                        control={
                                            <input
                                                type="checkbox"
                                                checked={consentToShare}
                                                onChange={handleConsentToggle}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ cursor: 'pointer', margin: 0 }}
                                            />
                                        }
                                    />
                                    <SettingsRow
                                        title={settingsText("Email Notifications")}
                                        description={settingsText("Receive email updates about AsterMargin")}
                                        onClick={handleEmailToggle}
                                        hasBorder
                                        control={
                                            <input
                                                type="checkbox"
                                                checked={emailNotifications}
                                                onChange={handleEmailToggle}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ cursor: 'pointer', margin: 0 }}
                                            />
                                        }
                                    />
                                </SettingsGroup>
                            </>
                        )}
                    </>
                )}

                {/* ===== SEARCH & FILES TAB ===== */}
                {effectiveActiveTab === 'sync' && (
                    <>
                        <CloudFeaturesBanner />
                        <SectionLabel>{settingsText("Libraries")}</SectionLabel>
                        <LibraryAccessList />

                        <BackgroundProcessingSection />
                    </>
                )}

                {/* ===== PERMISSIONS TAB ===== */}
                {effectiveActiveTab === 'permissions' && (
                    <PermissionsSection />
                )}

                {/* ===== PLAN & USAGE TAB ===== */}
                {effectiveActiveTab === 'billing' && (
                    <BillingSection />
                )}

                {/* ===== API KEYS TAB ===== */}
                {effectiveActiveTab === 'models' && (
                    <ApiKeysSection />
                )}

                {/* ===== ACTIONS TAB ===== */}
                {effectiveActiveTab === 'actions' && (
                    <ActionsPreferenceSection />
                )}

                {/* ===== ADVANCED TAB ===== */}
                {effectiveActiveTab === 'advanced' && (
                    <><ReadingRule /><SemanticSettings /><OcrSettings /><WebDavSettings /><AdvancedSection /></>
                )}
                </div>
            </div>
        </div>
    );
};

export default PreferencePage;
