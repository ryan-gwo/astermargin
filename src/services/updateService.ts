import config from "../../package.json";
import { getPref, setPref } from "../utils/prefs";

type UpdateMode = "default" | "enabled" | "disabled";

interface NativeAddon {
    id: string;
    version: string;
    applyBackgroundUpdates: number;
    pendingOperations?: number;
    findUpdates(
        listener: {
            onUpdateAvailable(addon: NativeAddon, install: NativeInstall): void;
            onUpdateFinished(addon: NativeAddon, status: number): void;
        },
        reason: number,
    ): void;
}

interface NativeInstall {
    version: string;
    state: number;
    error: number;
    install(): Promise<NativeAddon>;
}

interface NativeAddonManager {
    AUTOUPDATE_DEFAULT: number;
    AUTOUPDATE_ENABLE: number;
    AUTOUPDATE_DISABLE: number;
    UPDATE_WHEN_USER_REQUESTED: number;
    UPDATE_STATUS_NO_ERROR: number;
    STATE_AVAILABLE: number;
    ERROR_INCORRECT_HASH: number;
    PENDING_UPGRADE: number;
    PENDING_INSTALL: number;
    updateEnabled: boolean;
    shouldAutoUpdate(addon: NativeAddon): boolean;
    getAddonByID(id: string): Promise<NativeAddon | null>;
    addAddonListener(listener: object): void;
    removeAddonListener(listener: object): void;
    addManagerListener(listener: object): void;
    removeManagerListener(listener: object): void;
}

interface AvailableUpdate {
    version: string;
    notesUrl: string;
    summary?: string;
    publishedAt?: string;
}

type UpdateStatus =
    | {
          stage:
              | "idle"
              | "checking"
              | "current"
              | "installing"
              | "installed"
              | "restart";
      }
    | { stage: "available"; release: AvailableUpdate }
    | { stage: "error"; reason: "check" | "install" | "hash" };

export type UpdateState = UpdateStatus & {
    version: string;
    mode: UpdateMode;
    autoUpdate: boolean;
    backgroundChecks: boolean;
    lastChecked: string;
};

const addonId = config.config.addonID;
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const repository = "ryan-gwo/astermargin";
const observers = new Set<() => void>();
let status: UpdateStatus = { stage: "idle" };
let pending: NativeInstall | null = null;

function manager(): NativeAddonManager {
    return ChromeUtils.importESModule(
        "resource://gre/modules/AddonManager.sys.mjs",
    ).AddonManager as NativeAddonManager;
}

async function registeredAddon(api: NativeAddonManager): Promise<NativeAddon> {
    const addon = await api.getAddonByID(addonId);
    if (!addon)
        throw new Error("AsterMargin is not registered with AddonManager");
    return addon;
}

function publish(next: UpdateStatus): void {
    status = next;
    for (const observer of observers) observer();
}

export async function getUpdateState(): Promise<UpdateState> {
    const api = manager();
    const addon = await registeredAddon(api);
    const mode =
        addon.applyBackgroundUpdates === api.AUTOUPDATE_ENABLE
            ? "enabled"
            : addon.applyBackgroundUpdates === api.AUTOUPDATE_DISABLE
              ? "disabled"
              : "default";
    return {
        ...(status.stage === "idle" &&
        getPref("requestedUpdateVersion") === addon.version
            ? { stage: "installed" as const }
            : status),
        version: addon.version,
        mode,
        autoUpdate: api.shouldAutoUpdate(addon),
        backgroundChecks: api.updateEnabled,
        lastChecked: getPref("lastUpdateCheck"),
    };
}

export function observeUpdates(refresh: () => void): () => void {
    const api = manager();
    const addonListener = {
        onPropertyChanged(addon: NativeAddon, properties: string[]) {
            if (
                addon.id === addonId &&
                properties.includes("applyBackgroundUpdates")
            )
                refresh();
        },
        onInstalled(addon: NativeAddon) {
            if (addon.id === addonId) refresh();
        },
    };
    const managerListener = { onUpdateModeChanged: refresh };
    api.addAddonListener(addonListener);
    api.addManagerListener(managerListener);
    observers.add(refresh);
    return () => {
        observers.delete(refresh);
        api.removeAddonListener(addonListener);
        api.removeManagerListener(managerListener);
    };
}

async function setUpdateMode(mode: UpdateMode): Promise<void> {
    const api = manager();
    const addon = await registeredAddon(api);
    addon.applyBackgroundUpdates = {
        default: api.AUTOUPDATE_DEFAULT,
        enabled: api.AUTOUPDATE_ENABLE,
        disabled: api.AUTOUPDATE_DISABLE,
    }[mode];
}

export function setAutomaticUpdates(enabled: boolean): Promise<void> {
    return setUpdateMode(enabled ? "enabled" : "disabled");
}

export function restoreZoteroDefault(): Promise<void> {
    return setUpdateMode("default");
}

function findUpdate(
    api: NativeAddonManager,
    addon: NativeAddon,
): Promise<NativeInstall | null> {
    return new Promise((resolve, reject) => {
        let result: NativeInstall | null = null;
        addon.findUpdates(
            {
                onUpdateAvailable(_addon, install) {
                    if (stableVersion.test(install.version)) result = install;
                },
                onUpdateFinished(_addon, code) {
                    // Gecko also calls onNoUpdateAvailable on errors. Only the final
                    // callback distinguishes a failed check from an empty result.
                    if (code === api.UPDATE_STATUS_NO_ERROR) resolve(result);
                    else
                        reject(
                            new Error(
                                `AddonManager update check failed (${code})`,
                            ),
                        );
                },
            },
            api.UPDATE_WHEN_USER_REQUESTED,
        );
    });
}

function responseText(response: unknown): string {
    if (typeof response === "string") return response;
    if (response && typeof response === "object") {
        const value = (response as { responseText?: unknown }).responseText;
        if (typeof value === "string") return value;
    }
    return "";
}

function htmlToText(value: string): string {
    const withoutTags = value.replace(/<[^>]+>/g, " ");
    return withoutTags
        .replace(/&nbsp;/giu, " ")
        .replace(/&amp;/giu, "&")
        .replace(/&lt;/giu, "<")
        .replace(/&gt;/giu, ">")
        .replace(/&#39;/giu, "'")
        .replace(/&quot;/giu, '"')
        .replace(/\s+/gu, " ")
        .trim();
}

export function parseReleasePage(
    html: string,
    version: string,
): Partial<AvailableUpdate> {
    const date = html.match(
        /<relative-time[^>]+datetime=["']([^"']+)["']/iu,
    )?.[1];
    const body = html.match(
        /<div[^>]+data-test-selector=["']body-content["'][^>]*>([\s\S]*?)<\/div>/iu,
    )?.[1];
    return {
        ...(date && Number.isFinite(Date.parse(date))
            ? { publishedAt: date }
            : {}),
        ...(body
            ? { summary: htmlToText(body).slice(0, 1600) || undefined }
            : {}),
        version,
    };
}

async function releaseDetails(version: string): Promise<AvailableUpdate> {
    const tag = `v${version}`;
    const release: AvailableUpdate = {
        version,
        notesUrl: `https://github.com/${repository}/releases/tag/${tag}`,
    };
    try {
        const response = await Zotero.HTTP.request(
            "GET",
            `https://api.github.com/repos/${repository}/releases/tags/${tag}`,
            {
                timeout: 7000,
                responseType: "text",
                headers: {
                    Accept: "application/vnd.github+json",
                    "User-Agent": "AsterMargin-Zotero",
                },
            },
        );
        const details = JSON.parse(responseText(response));
        if (details.tag_name !== tag || details.draft || details.prerelease)
            return release;
        if (
            typeof details.published_at === "string" &&
            Number.isFinite(Date.parse(details.published_at))
        ) {
            release.publishedAt = details.published_at;
        }
        if (typeof details.body === "string")
            release.summary = details.body.trim().slice(0, 1600) || undefined;
    } catch (apiError) {
        // GitHub's unauthenticated API is rate limited. The public release
        // page carries the same date and notes, so use it when the API cannot
        // be reached instead of showing two empty fields in the preferences.
        try {
            const page = await Zotero.HTTP.request(
                "GET",
                `https://github.com/${repository}/releases/tag/${tag}`,
                { timeout: 7000, responseType: "text" },
            );
            Object.assign(
                release,
                parseReleasePage(responseText(page), version),
            );
        } catch (pageError) {
            Zotero.logError(pageError as Error);
            Zotero.logError(apiError as Error);
        }
    }
    return release;
}

export async function checkForUpdates(): Promise<void> {
    if (
        status.stage === "checking" ||
        status.stage === "installing" ||
        status.stage === "restart"
    )
        return;
    publish({ stage: "checking" });
    pending = null;
    let outcome: UpdateStatus;
    try {
        setPref("requestedUpdateVersion", "");
        const api = manager();
        const install = await findUpdate(api, await registeredAddon(api));
        if (install) {
            const release = await releaseDetails(install.version);
            if (install.state === api.STATE_AVAILABLE) {
                pending = install;
                outcome = { stage: "available", release };
            } else {
                // A concurrent native background check can take over the install.
                outcome = { stage: "idle" };
            }
        } else {
            outcome = { stage: "current" };
        }
    } catch (error) {
        Zotero.logError(error as Error);
        outcome = { stage: "error", reason: "check" };
    }
    setPref("lastUpdateCheck", new Date().toISOString());
    publish(outcome);
}

export async function installAvailableUpdate(): Promise<void> {
    if (status.stage !== "available" || !pending) return;
    const install = pending;
    pending = null;
    publish({ stage: "installing" });
    const api = manager();
    try {
        if (install.state !== api.STATE_AVAILABLE) {
            publish({ stage: "idle" });
            return;
        }
        // A successful bootstrap update closes this settings window. Let the
        // next instance confirm completion against its native version.
        setPref("requestedUpdateVersion", install.version);
        await install.install();
        const addon = await registeredAddon(api);
        const requiresRestart =
            (addon.pendingOperations ?? 0) &
            (api.PENDING_UPGRADE | api.PENDING_INSTALL);
        publish({ stage: requiresRestart ? "restart" : "installed" });
    } catch (error) {
        setPref("requestedUpdateVersion", "");
        Zotero.logError(error as Error);
        publish({
            stage: "error",
            reason:
                install.error === api.ERROR_INCORRECT_HASH ? "hash" : "install",
        });
    }
}
