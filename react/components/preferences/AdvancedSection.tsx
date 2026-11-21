import { settingsText } from "../../utils/settingsText";
import { useSurfaceWindow } from '../../runtime/SurfaceWindowContext';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@astermargin/agent-ui/primitives/Button";
import {SettingsGroup, SettingsRow, DocLink} from "./components/SettingsElements";
import { dataProviderEnabledAtom, mcpServerEnabledAtom, mcpWriteToolsEnabledAtom } from "../../atoms/ui";
import { useAtom, useSetAtom } from "jotai";
import { currentMessageExternalFilesAtom } from "../../atoms/messageComposition";
import { ensureMcpBridgeScript } from "../../hooks/useMcpServer";
import { copyToClipboard } from "../../utils/clipboard";
import { logger } from "@astermargin/agent-core/platform/logger";
import { setPref } from "../../../src/utils/prefs";
import { TickIcon, CopyIcon } from "../icons/icons";
import CustomInstructionsSection from "./CustomInstructionsSection";
import LocalDocumentCacheRow from "./LocalDocumentCacheRow";
import RebuildSearchIndexRow from "./RebuildSearchIndexRow";
import {
    deleteAllExternalFiles,
    getExternalFilesStats,
    revealExternalFilesDir,
} from "../../../src/services/externalFiles";

import { plural } from "./processingStatusSentence";

/** File count and total size for the external files row. */

function formatStorageStats(count: number, totalBytes: number): string {
    const files = plural(count, "file");
    if (totalBytes <= 0) return files;
    const mb = totalBytes / 1024 / 1024;
    const size = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(totalBytes / 1024))} KB`;
    return settingsText("{files} · {size}", { files, size });
}


const AdvancedSection: React.FC = () => {
    const surfaceWindow = useSurfaceWindow();

    // --- Storage: external files + document cache ---
    const setCurrentMessageExternalFiles = useSetAtom(currentMessageExternalFilesAtom);
    const [externalFileStats, setExternalFileStats] = useState<{ count: number; totalBytes: number } | null>(null);
    const [isDeletingExternalFiles, setIsDeletingExternalFiles] = useState(false);

    const refreshExternalFileStats = useCallback(async () => {
        try {
            setExternalFileStats(await getExternalFilesStats());
        } catch (error) {
            logger(`AdvancedSection: failed to load external file stats: ${error}`, 1);
            setExternalFileStats(null);
        }
    }, []);

    useEffect(() => {
        refreshExternalFileStats();
    }, [refreshExternalFileStats]);

    const handleShowExternalFilesFolder = useCallback(() => {
        revealExternalFilesDir().catch((error) => {
            logger(`AdvancedSection: failed to reveal external files folder: ${error}`, 1);
        });
    }, []);

    const handleDeleteAllExternalFiles = useCallback(async () => {
        const stats = externalFileStats ?? { count: 0, totalBytes: 0 };
        const buttonIndex = Zotero.Prompt.confirm({
            window: surfaceWindow,
            title: settingsText("Delete External Files?"),
            text:
                settingsText("Delete {files} attached to past chats?", { files: formatStorageStats(stats.count, stats.totalBytes) }) + "\n\n" +
                settingsText("AsterMargin will no longer be able to read these files in past conversations.") + " " +
                settingsText("Files can be re-attached at any time."),
            button0: settingsText("Delete"),
            // Cancel at button1 so Escape/dialog-close routes here.
            button1: Zotero.Prompt.BUTTON_TITLE_CANCEL,
            defaultButton: 1,
        });
        if (buttonIndex !== 0) return;
        setIsDeletingExternalFiles(true);
        try {
            await deleteAllExternalFiles();
            // Pending input-area chips reference the deleted copies.
            setCurrentMessageExternalFiles([]);
        } catch (error) {
            logger(`AdvancedSection: failed to delete external files: ${error}`, 1);
        } finally {
            setIsDeletingExternalFiles(false);
            refreshExternalFileStats();
        }
    }, [externalFileStats, refreshExternalFileStats, setCurrentMessageExternalFiles]);

    // --- Atoms: MCP Server enabled ---
    const [mcpServerEnabled, setMcpServerEnabled] = useAtom(mcpServerEnabledAtom);
    const [mcpWriteToolsEnabled, setMcpWriteToolsEnabled] = useAtom(mcpWriteToolsEnabledAtom);
    const [mcpCopied, setMcpCopied] = useState(false);
    const [mcpHttpCopied, setMcpHttpCopied] = useState(false);

    // --- MCP Server port ---
    const mcpServerPort = useMemo(() => {
        try {
            return Number(Zotero.Prefs.get('httpServer.port')) || 23119;
        } catch {
            return 23119;
        }
    }, []);

    // --- Copy MCP config for HTTP clients ---
    const handleCopyMcpConfig = useCallback(async () => {
        try {
            const scriptPath = await ensureMcpBridgeScript();
            const serverConfig: any = {
                command: "node",
                args: [scriptPath],
            };
            if (mcpServerPort !== 23119) {
                serverConfig.args.push(String(mcpServerPort));
            }
            const config = JSON.stringify({
                mcpServers: {
                    "astermargin-zotero": serverConfig,
                }
            }, null, 2);
            await copyToClipboard(config);
            setMcpCopied(true);
            setTimeout(() => setMcpCopied(false), 2000);
        } catch (err: any) {
            logger(`Failed to copy MCP config: ${err?.message}`, 1);
        }
    }, [mcpServerPort]);

    const mcpEndpointUrl = `http://localhost:${mcpServerPort}/astermargin/mcp`;

    // --- Copy MCP config for HTTPS-only clients ---
    const handleCopyMcpHttpConfig = useCallback(async () => {
        const config = JSON.stringify({
            mcpServers: {
                "astermargin-zotero": {
                    type: "http",
                    url: mcpEndpointUrl
                }
            }
        }, null, 2);
        await copyToClipboard(config);
        setMcpHttpCopied(true);
        setTimeout(() => setMcpHttpCopied(false), 2000);
    }, [mcpEndpointUrl]);

    // --- Toggle MCP server enabled ---
    const handleMcpServerToggle = useCallback(() => {
        const newValue = !mcpServerEnabled;
        setPref('mcpServerEnabled', newValue);
        setMcpServerEnabled(newValue);
    }, [mcpServerEnabled, setMcpServerEnabled]);

    const handleMcpWriteToolsToggle = useCallback(() => {
        const newValue = !mcpWriteToolsEnabled;
        setPref('mcpCreateNoteToolEnabled', newValue);
        setMcpWriteToolsEnabled(newValue);
    }, [mcpWriteToolsEnabled, setMcpWriteToolsEnabled]);

    // --- Data provider (library access for other AsterMargin clients) ---
    const [dataProviderEnabled, setDataProviderEnabled] = useAtom(dataProviderEnabledAtom);
    const handleDataProviderToggle = useCallback(() => {
        const newValue = !dataProviderEnabled;
        setPref('dataProviderEnabled', newValue);
        setDataProviderEnabled(newValue);
    }, [dataProviderEnabled, setDataProviderEnabled]);

    return (
        <>
            {/* ===== CUSTOM INSTRUCTIONS ===== */}
            <CustomInstructionsSection />

            {/* ===== STORAGE ===== */}
            <div className="display-flex flex-row items-center gap-2" style={{ marginTop: '20px', marginBottom: '6px', paddingLeft: '2px' }}>
                <div className="text-lg font-color-primary font-bold">{settingsText("Storage")}</div>
            </div>
            <div className="text-base font-color-secondary mb-2" style={{ paddingLeft: '2px' }}>
                {settingsText("Data AsterMargin stores on this computer. This data is not deleted automatically including when the plugin is removed.")}
            </div>
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("External Files")}
                    description={
                        <>
                            {settingsText("Copies of external files you attach to chats.")}
                            {externalFileStats && externalFileStats.count > 0 && (
                                <span className="display-flex mt-1">
                                    {formatStorageStats(externalFileStats.count, externalFileStats.totalBytes)}
                                </span>
                            )}
                        </>
                    }
                    control={
                        <div className="display-flex flex-row items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleDeleteAllExternalFiles}
                                disabled={isDeletingExternalFiles || !externalFileStats || externalFileStats.count === 0}
                                loading={isDeletingExternalFiles}
                                style={{ padding: '4px 6px' }}
                            >
                                {settingsText("Delete All…")}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleShowExternalFilesFolder}
                                style={{ padding: '4px 6px' }}
                            >
                                {settingsText("Show Folder")}
                            </Button>
                        </div>
                    }
                />
                <LocalDocumentCacheRow hasBorder />
            </SettingsGroup>

            {/* ===== TROUBLESHOOTING ===== */}
            <div className="display-flex flex-row items-center gap-2" style={{ marginTop: '20px', marginBottom: '6px', paddingLeft: '2px' }}>
                <div className="text-lg font-color-primary font-bold">{settingsText("Troubleshooting")}</div>
            </div>
            <SettingsGroup>
                <RebuildSearchIndexRow />
            </SettingsGroup>

            {/* ===== CONNECTED APPS (DATA PROVIDER) ===== */}
            {process.env.NODE_ENV === 'development' && (
                <>
                    <div className="display-flex flex-row items-center gap-2" style={{ marginTop: '20px', marginBottom: '6px', paddingLeft: '2px' }}>
                        <div className="text-lg font-color-primary font-bold">{settingsText("Connected Apps")}</div>
                        <span className="text-xs font-color-secondary px-15 py-05 rounded-md bg-quinary border-quinary">{settingsText("Experimental")}</span>
                    </div>
                    <div className="text-base font-color-secondary mb-2" style={{ paddingLeft: '2px' }}>
                        {settingsText("Lets AsterMargin in other apps access your Zotero library while Zotero is running.")}
                    </div>
                    <SettingsGroup>
                        <SettingsRow
                            title={settingsText("Allow Library Access")}
                            description={settingsText("AsterMargin chats started in connected apps can search and read this Zotero library")}
                            onClick={handleDataProviderToggle}
                            control={
                                <div className="display-flex flex-row items-center gap-2">
                                    <input
                                        type="checkbox"
                                        aria-label={settingsText("Allow Library Access")}
                                        checked={dataProviderEnabled}
                                        onChange={handleDataProviderToggle}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer', margin: 0 }}
                                    />
                                </div>
                            }
                        />
                    </SettingsGroup>
                </>
            )}

            {/* ===== MCP SERVER ===== */}
            <div className="display-flex flex-row items-center gap-2" style={{ marginTop: '20px', marginBottom: '6px', paddingLeft: '2px' }}>
                <div className="text-lg font-color-primary font-bold">{settingsText("MCP Server")}</div>
                <span className="text-xs font-color-secondary px-15 py-05 rounded-md bg-quinary border-quinary">{settingsText("Experimental")}</span>
            </div>
            <div className="text-base font-color-secondary mb-2" style={{ paddingLeft: '2px' }}>
                {settingsText("The MCP server lets AI coding tools like Claude Code, Cursor, and Windsurf search and access your Zotero library.")}
                {' '}<DocLink path="mcp-server">{settingsText("MCP server guide")}</DocLink>
            </div>
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("Enable MCP Server")}
                    description={settingsText("Endpoint at localhost:{port}", { port: mcpServerPort })}
                    onClick={handleMcpServerToggle}
                    tooltip={settingsText("Expose your Zotero library to MCP-compatible AI tools")}
                    control={
                        <div className="display-flex flex-row items-center gap-2">
                            <input
                                type="checkbox"
                                aria-label={settingsText("Enable MCP Server")}
                                checked={mcpServerEnabled}
                                onChange={handleMcpServerToggle}
                                onClick={(e) => e.stopPropagation()}
                                style={{ cursor: 'pointer', margin: 0 }}
                            />
                        </div>
                    }
                />
                <SettingsRow
                    title={settingsText("Enable Write Tools")}
                    description={settingsText("Allow MCP clients to create Zotero notes, highlights, and sticky-note annotations. Changing setting requires reloading of the MCP server.")}
                    onClick={handleMcpWriteToolsToggle}
                    hasBorder
                    tooltip={settingsText("Advertise and allow the MCP tools that write to your library")}
                    control={
                        <div className="display-flex flex-row items-center gap-2">
                            <input
                                type="checkbox"
                                aria-label={settingsText("Enable Write Tools")}
                                checked={mcpWriteToolsEnabled}
                                onChange={handleMcpWriteToolsToggle}
                                onClick={(e) => e.stopPropagation()}
                                style={{ cursor: 'pointer', margin: 0 }}
                            />
                        </div>
                    }
                />
                <SettingsRow
                    title={settingsText("Config for HTTP Clients")}
                    description={
                        <span className="display-flex flex-col gap-05" style={{ opacity: mcpServerEnabled ? 1 : 0.45 }}>
                            <span>{settingsText("For clients that support HTTP directly (e.g., Claude Code, Cursor).")}</span>
                            {/* <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{mcpEndpointUrl}</span> */}
                        </span>
                    }
                    hasBorder
                    disabled={!mcpServerEnabled}
                    control={
                        <Button
                            variant="outline"
                            icon={mcpHttpCopied ? TickIcon : CopyIcon}
                            onClick={handleCopyMcpHttpConfig}
                            disabled={!mcpServerEnabled}
                            style={{ padding: '4px 6px' }}
                        >
                            {mcpHttpCopied ? settingsText("Copied") : settingsText("Copy")}
                        </Button>
                    }
                />
                <SettingsRow
                    title={settingsText("Config for HTTPS-Only Clients")}
                    description={
                        <span style={{ opacity: mcpServerEnabled ? 1 : 0.45 }}>
                            {settingsText("For clients that only connect to HTTPS endpoints (e.g., Claude Desktop). Requires Node.js.")}
                        </span>
                    }
                    hasBorder
                    disabled={!mcpServerEnabled}
                    control={
                        <Button
                            variant="outline"
                            icon={mcpCopied ? TickIcon : CopyIcon}
                            onClick={handleCopyMcpConfig}
                            disabled={!mcpServerEnabled}
                            style={{ padding: '4px 6px' }}
                        >
                            {mcpCopied ? settingsText("Copied") : settingsText("Copy")}
                        </Button>
                    }
                />
            </SettingsGroup>
        </>
    );
};

export default AdvancedSection;
