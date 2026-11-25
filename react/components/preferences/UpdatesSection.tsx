import React, { useEffect, useState } from "react";
import Button from "@astermargin/agent-ui/primitives/Button";
import {
    checkForUpdates,
    getUpdateState,
    installAvailableUpdate,
    observeUpdates,
    restoreZoteroDefault,
    setAutomaticUpdates,
    type UpdateState,
} from "../../../src/services/updateService";
import { interfaceLocale } from "../../../src/utils/interfaceLanguage";
import { settingsText } from "../../utils/settingsText";
import {
    ExternalLink,
    SectionLabel,
    SettingsGroup,
    SettingsRow,
    SettingsSwitch,
} from "./components/SettingsElements";

function formatDate(value: string, withTime = false): string {
    return new Intl.DateTimeFormat(interfaceLocale(), {
        dateStyle: "medium",
        timeStyle: withTime ? "short" : undefined,
    }).format(new Date(value));
}

function updateMessage(state: UpdateState): string {
    switch (state.stage) {
        case "checking":
            return settingsText("Checking for updates…");
        case "current":
            return settingsText("No compatible update is available.");
        case "installing":
            return settingsText("Installing update…");
        case "installed":
            return settingsText("Update installed.");
        case "restart":
            return settingsText(
                "Restart Zotero to finish installing the update.",
            );
        case "error":
            return settingsText(
                (
                    {
                        check: "Could not check for updates. Try again.",
                        install:
                            "Could not install the update. Check for updates again.",
                        hash: "The update file failed verification. Check for updates again.",
                    } as const
                )[state.reason],
            );
        default:
            return "";
    }
}

export function UpdatesSection({ embedded = false }: { embedded?: boolean } = {}) {
    const [state, setState] = useState<UpdateState>();
    const [unavailable, setUnavailable] = useState(false);
    const [savingMode, setSavingMode] = useState(false);
    const [modeError, setModeError] = useState(false);

    useEffect(() => {
        let active = true;
        let stop: (() => void) | undefined;
        const refresh = () => {
            void getUpdateState().then(
                (next) => {
                    if (!active) return;
                    setUnavailable(false);
                    setState(next);
                },
                (error) => {
                    if (active) setUnavailable(true);
                    Zotero.logError(error as Error);
                },
            );
        };
        try {
            stop = observeUpdates(refresh);
            refresh();
        } catch (error) {
            setUnavailable(true);
            Zotero.logError(error as Error);
        }
        return () => {
            active = false;
            stop?.();
        };
    }, []);

    const changeMode = async (operation: () => Promise<void>) => {
        setSavingMode(true);
        setModeError(false);
        try {
            await operation();
            setState(await getUpdateState());
        } catch (error) {
            setModeError(true);
            Zotero.logError(error as Error);
        } finally {
            setSavingMode(false);
        }
    };

    const checking = state?.stage === "checking";
    const release = state?.stage === "available" ? state.release : undefined;
    const message = state ? updateMessage(state) : "";
    return (
        <>
            {!embedded && <SectionLabel>{settingsText("Updates")}</SectionLabel>}
            <SettingsGroup>
                <SettingsRow
                    title={settingsText("Current version {version}", {
                        version:
                            state?.version ?? Zotero.AsterMargin.pluginVersion,
                    })}
                    description={
                        <div className="display-flex flex-col gap-05">
                            <span>{settingsText("Stable channel")}</span>
                            <span>
                                {state?.lastChecked &&
                                Number.isFinite(Date.parse(state.lastChecked))
                                    ? settingsText("Last manual check {time}", {
                                          time: formatDate(
                                              state.lastChecked,
                                              true,
                                          ),
                                      })
                                    : settingsText("No manual checks yet")}
                            </span>
                            {unavailable ? (
                                <span role="alert">
                                    {settingsText(
                                        "Zotero update controls are unavailable.",
                                    )}
                                </span>
                            ) : null}
                            <output aria-live="polite">{message}</output>
                        </div>
                    }
                    announceDescription
                    control={
                        <Button
                            id="astermargin-check-updates"
                            ariaLabel={settingsText("Check for updates")}
                            variant="outline"
                            loading={checking}
                            disabled={
                                unavailable ||
                                !state ||
                                state.stage === "installing" ||
                                state.stage === "restart"
                            }
                            onClick={() => void checkForUpdates()}
                        >
                            {settingsText("Check for updates")}
                        </Button>
                    }
                />
                {release && (
                    <SettingsRow
                        hasBorder
                        title={settingsText("Version {version} is available", {
                            version: release.version,
                        })}
                        description={
                            <div
                                className="display-flex flex-col gap-1"
                                role="status"
                            >
                                <span>
                                    {release.publishedAt
                                        ? settingsText("Released {date}", {
                                              date: formatDate(
                                                  release.publishedAt,
                                              ),
                                          })
                                        : settingsText(
                                              "Release date unavailable",
                                          )}
                                </span>
                                <span
                                    style={{
                                        whiteSpace: "pre-line",
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {release.summary ??
                                        settingsText(
                                            "Release summary unavailable.",
                                        )}
                                </span>
                                <ExternalLink href={release.notesUrl}>
                                    {settingsText("View release notes")}
                                </ExternalLink>
                            </div>
                        }
                        announceDescription
                        control={
                            <Button
                                id="astermargin-install-update"
                                ariaLabel={settingsText("Update now")}
                                variant="solid"
                                onClick={() => void installAvailableUpdate()}
                            >
                                {settingsText("Update now")}
                            </Button>
                        }
                    />
                )}
                <SettingsRow
                    hasBorder
                    title={settingsText("Automatic updates")}
                    description={
                        <div className="display-flex flex-col gap-05">
                            <span>
                                {settingsText(
                                    state?.mode === "default"
                                        ? state.autoUpdate
                                            ? "Following Zotero default (on)"
                                            : "Following Zotero default (off)"
                                        : state?.mode === "enabled"
                                          ? "On for AsterMargin"
                                          : state?.mode === "disabled"
                                            ? "Off for AsterMargin"
                                            : "Use Zotero to install stable updates automatically.",
                                )}
                            </span>
                            {state && !state.backgroundChecks && (
                                <span>
                                    {settingsText(
                                        "Background update checks are disabled in Zotero.",
                                    )}
                                </span>
                            )}
                            {state && state.mode !== "default" && (
                                <div>
                                    <Button
                                        id="astermargin-restore-update-default"
                                        variant="ghost"
                                        disabled={savingMode}
                                        onClick={() =>
                                            void changeMode(
                                                restoreZoteroDefault,
                                            )
                                        }
                                    >
                                        {settingsText("Follow Zotero default")}
                                    </Button>
                                </div>
                            )}
                            {modeError && (
                                <span role="alert">
                                    {settingsText(
                                        "Could not change automatic updates.",
                                    )}
                                </span>
                            )}
                        </div>
                    }
                    announceDescription
                    control={
                        <SettingsSwitch
                            id="astermargin-auto-updates"
                            checked={state?.autoUpdate ?? false}
                            disabled={unavailable || !state || savingMode}
                            onChange={(enabled) => {
                                void changeMode(() => setAutomaticUpdates(enabled));
                            }}
                        />
                    }
                />
            </SettingsGroup>
        </>
    );
}
