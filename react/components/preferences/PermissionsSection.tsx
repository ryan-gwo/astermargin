import { settingsText } from "../../utils/settingsText";
import { usePreference } from '../../hooks/usePreference';
import React, { useCallback, useState } from "react";
import {SettingsGroup, SettingsRow, SectionLabel, DocLink, SectionDescription} from "./components/SettingsElements";
import DeferredToolPreferenceSetting from "./DeferredToolPreferenceSetting";
import { getPref, setPref } from "../../../src/utils/prefs";


const PermissionsSection: React.FC = () => {

    // --- Atoms: Permissions ---
    const [autoApplyAnnotations, setAutoApplyAnnotations] = usePreference(() => getPref('autoApplyAnnotations'));
    const [enableSystemNotifications, setEnableSystemNotifications] = usePreference(() => getPref('enableSystemNotifications'));
    const [enableResponseCompleteNotifications, setEnableResponseCompleteNotifications] = usePreference(() => getPref('enableResponseCompleteNotifications'));
    const [accessRemoteFiles, setAccessRemoteFiles] = usePreference(() => getPref('accessRemoteFiles'));

    // --- Handle Auto-Apply Annotations Toggle ---
    const handleAutoApplyAnnotationsToggle = useCallback(() => {
        const newValue = !autoApplyAnnotations;
        setPref('autoApplyAnnotations', newValue);
        setAutoApplyAnnotations(newValue);
    }, [autoApplyAnnotations]);

    // --- Handle System Notifications Toggle ---
    const handleEnableSystemNotificationsToggle = useCallback(() => {
        const newValue = !enableSystemNotifications;
        setPref('enableSystemNotifications', newValue);
        setEnableSystemNotifications(newValue);
    }, [enableSystemNotifications]);

    // --- Handle Response Complete Notifications Toggle ---
    const handleEnableResponseCompleteNotificationsToggle = useCallback(() => {
        const newValue = !enableResponseCompleteNotifications;
        setPref('enableResponseCompleteNotifications', newValue);
        setEnableResponseCompleteNotifications(newValue);
    }, [enableResponseCompleteNotifications]);

    // --- Handle Access Remote Files Toggle ---
    const handleAccessRemoteFilesToggle = useCallback(() => {
        const newValue = !accessRemoteFiles;
        setPref('accessRemoteFiles', newValue);
        setAccessRemoteFiles(newValue);
    }, [accessRemoteFiles]);

    return (
        <>
            <SectionLabel>{settingsText("Library Modifications")}</SectionLabel>
            <SectionDescription>
                {settingsText("When AsterMargin modifies your library, all changes require your approval by default (the only exception is when AsterMargin creates a new note). You can change this behavior here. Be careful, AsterMargin might make changes you didn't expect.")}
                {' '}<DocLink path="editing-metadata">{settingsText("Editing metadata")}</DocLink>
                {' · '}<DocLink path="library-management">{settingsText("Organizing library items")}</DocLink>
            </SectionDescription>
            <SettingsGroup>
                <div style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="edit_metadata"
                        label={settingsText("Metadata Edits")}
                        description={settingsText("Changes to item titles, authors, abstracts, and other metadata")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="create_note"
                        label={settingsText("Note Creation")}
                        description={settingsText("Creating new Zotero notes")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="edit_note"
                        label={settingsText("Note Edits")}
                        description={settingsText("Changes to Zotero note content")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="create_highlight_annotations"
                        label={settingsText("PDF Annotations")}
                        description={settingsText("Creating and editing annotations. Deleting annotations always asks for confirmation.")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="create_items"
                        label={settingsText("Item Imports")}
                        description={settingsText("Importing new items from external sources")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="create_collection"
                        label={settingsText("Item Organization")}
                        description={settingsText("Creating collections and adding or removing tags and collections on selected items")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="merge_items"
                        label={settingsText("Duplicate Merges")}
                        description={settingsText("Combining duplicate records with undo support")}
                    />
                </div>
                <div className="border-top-quinary" style={{ padding: '8px 12px' }}>
                    <DeferredToolPreferenceSetting
                        toolName="manage_tags"
                        label={settingsText("Tag & Collection Management")}
                        description={settingsText("Library-wide tag and collection rename, move, merge, and delete operations")}
                    />
                </div>
            </SettingsGroup>

            <SectionLabel>{settingsText("System Notifications")}</SectionLabel>
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("Approval Notifications")}
                    description={settingsText("Show a system notification when AsterMargin is waiting for your decision and is not visible.")}
                    onClick={handleEnableSystemNotificationsToggle}
                    hasBorder
                    control={
                        <input
                            type="checkbox"
                            checked={enableSystemNotifications}
                            onChange={handleEnableSystemNotificationsToggle}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                    }
                />
                <SettingsRow
                    title={settingsText("Response Notifications")}
                    description={settingsText("Show a system notification when a response is ready and AsterMargin is not visible.")}
                    onClick={handleEnableResponseCompleteNotificationsToggle}
                    hasBorder
                    control={
                        <input
                            type="checkbox"
                            checked={enableResponseCompleteNotifications}
                            onChange={handleEnableResponseCompleteNotificationsToggle}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                    }
                />
            </SettingsGroup>

            <SectionLabel>{settingsText("Auto-Apply")}</SectionLabel>
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("Auto-Apply Annotations")}
                    description={settingsText("Automatically apply annotations to PDFs when created by the agent (only when PDF is open)")}
                    onClick={handleAutoApplyAnnotationsToggle}
                    control={
                        <input
                            type="checkbox"
                            checked={autoApplyAnnotations}
                            onChange={handleAutoApplyAnnotationsToggle}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                    }
                />
            </SettingsGroup>

            <SectionLabel>{settingsText("File Access")}</SectionLabel>
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("Access Remote Files")}
                    description={settingsText("Download PDF files from the Zotero server when not available locally")}
                    onClick={handleAccessRemoteFilesToggle}
                    tooltip={settingsText("When enabled, AsterMargin will attempt to download PDFs from the Zotero server or WebDAV if the file is not on your local machine. Disable this if you experience slow responses or don't want remote file downloads.")}
                    control={
                        <input
                            type="checkbox"
                            checked={accessRemoteFiles}
                            onChange={handleAccessRemoteFilesToggle}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', margin: 0 }}
                        />
                    }
                />
            </SettingsGroup>
        </>
    );
};

export default PermissionsSection;
