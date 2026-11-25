import { settingsText } from "../../utils/settingsText";
import React, { useEffect, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { cloudConsentAtom, hasOcrAccessAtom, hasSearchIndexAccessAtom } from '../../atoms/profile';
import {
    backgroundProcessingStatusAtom,
    type BackgroundProcessingStatus,
} from '../../atoms/backgroundProcessing';
import {
    embeddingIndexStateAtom,
    forceReindexAtom,
    isEmbeddingIndexingAtom,
    type EmbeddingIndexState,
} from '../../atoms/embeddingIndex';
import { useBackgroundProcessingStatus } from '../../hooks/useBackgroundProcessingStatus';
import { getPref, setPref } from '../../../src/utils/prefs';
import type { AttachmentRef, ProcessingIssueReason } from '../../../src/services/backgroundProcessing/issues';
import Spinner from '@astermargin/agent-ui/icons/Spinner';
import Button from '@astermargin/agent-ui/primitives/Button';
import Tooltip from '@astermargin/agent-ui/primitives/Tooltip';
import { ExternalLink, SettingsGroup, SettingsRow, SectionLabel, SettingsSwitch } from './components/SettingsElements';
import ProcessingIssueGroupRow from './ProcessingIssueList';
import { ProgressBar } from '../status/ProgressBar';
import { describeStatus, plural, type StatusSentence, type StatusTone } from './processingStatusSentence';
import PlayIcon from '@astermargin/agent-ui/icons/PlayIcon';
import StopIcon from '@astermargin/agent-ui/icons/StopIcon';
import { prepareUncachedFiles } from '../../../src/services/backgroundProcessing/cachePreparation';

const TONE_COLOR: Record<StatusTone, string> = {
    idle: 'var(--accent-green)',
    busy: 'var(--accent-blue)',
    waiting: 'var(--tag-yellow)',
    error: 'var(--tag-red)',
};

/** Activity and its explanation, followed by progress and cumulative file problems. */
const ProcessingStatusRow: React.FC<{
    status: BackgroundProcessingStatus;
    sentence: StatusSentence;
    /** The clicked action is still preparing work; the button waits for it. */
    processing: boolean;
    onProcessNow: () => void;
    onStopDrain: () => void;
    onShowProblems: () => void;
    /** The last server search-index check failed. */
    searchIndexUnavailable: boolean;
}> = ({
    status, sentence, processing, onProcessNow, onStopDrain, onShowProblems, searchIndexUnavailable,
}) => {
    const run = status.progress;
    const issueCount = status.issues.reduce((sum, group) => sum + group.count, 0);
    const indexIssueCount = status.issues.find((group) => group.reason === 'index_failed')?.count ?? 0;
    const readingIssueCount = issueCount - indexIssueCount;
    // One line for every kind of problem; the Problems section directly below
    // breaks them down by reason.
    const problemMessage = indexIssueCount > 0 && readingIssueCount > 0
        ? "{files} could not be read or indexed."
        : indexIssueCount > 0 ? "{files} could not be indexed." : "{files} could not be read.";
    const progress = run && run.total > 0 && (run.pending > 0 || (status.worker?.inFlight ?? 0) > 0) ? {
        total: run.total,
        done: run.succeeded + run.problems + run.removed,
    } : null;

    return (
        <div className="display-flex flex-col border-top-quinary p-2" style={{ padding: '8px 12px'}}>
            <div className="display-flex flex-row items-center gap-3" style={{ minHeight: '24px' }}>
                <div className="display-flex flex-row items-start gap-2 flex-1 min-w-0">
                    <div
                        className="display-flex items-center justify-center flex-shrink-0"
                        style={{ width: '14px', height: '1.25em' }}
                    >
                        {sentence.tone === 'busy'
                            ? <Spinner size={14} className="font-color-accent-blue" />
                            : <span
                                aria-hidden="true"
                                style={{ width: '10px', height: '10px', borderRadius: '50%', background: TONE_COLOR[sentence.tone] }}
                            />
                        }
                    </div>
                    <div
                        role="status"
                        className={`text-base font-medium flex-1 min-w-0 ${sentence.tone === 'error' ? 'font-color-red' : 'font-color-primary'}`}
                    >
                        {sentence.headline}
                    </div>
                </div>
                {sentence.stopDrain ? (
                    <Tooltip
                        content={settingsText("The current file finishes first. Processing then waits until your computer is idle.")}
                        placement="top"
                    >
                        <Button
                            variant="outline"
                            className="flex-shrink-0"
                            rightIcon={StopIcon}
                            onClick={onStopDrain}
                        >
                            {settingsText("Stop")}
                        </Button>
                    </Tooltip>
                ) : sentence.processNow ? (
                    <Tooltip
                        content={sentence.caption}
                        disabled={!sentence.processNowBlocked}
                        placement="top"
                    >
                        <Button
                            variant="outline"
                            className="flex-shrink-0"
                            rightIcon={PlayIcon}
                            disabled={sentence.processNowBlocked || processing || status.progress?.discovering}
                            loading={processing}
                            ariaLabel={sentence.processNowBlocked
                                ? settingsText("Start now. {reason}", { reason: sentence.caption })
                                : undefined}
                            onClick={onProcessNow}
                        >
                            {settingsText("Start now")}
                        </Button>
                    </Tooltip>
                ) : null}
            </div>
            <div className="text-base font-color-secondary" style={{ paddingLeft: '22px', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                {sentence.caption}
                {sentence.tone === 'error' && status.error && (
                    <span className="font-color-tertiary"> ({status.error})</span>
                )}
            </div>
            {progress && (
                <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={progress.total}
                    aria-valuenow={progress.done}
                    aria-label={settingsText("{done} of {total} attachments finished in this run", { done: progress.done.toLocaleString(), total: progress.total.toLocaleString() })}
                    className="display-flex flex-row items-start gap-3"
                    style={{ paddingLeft: '22px' }}
                >
                    <div className="flex-1 min-w-0">
                        <ProgressBar progress={Math.floor((progress.done / progress.total) * 100)} />
                    </div>
                    <span className="text-sm font-color-secondary flex-shrink-0" aria-hidden="true">
                        {settingsText("{done} of {total}", { done: progress.done.toLocaleString(), total: progress.total.toLocaleString() })}
                    </span>
                </div>
            )}
            {searchIndexUnavailable && <div className="text-sm font-color-secondary" style={{ paddingLeft: '22px' }}>
                {settingsText("The search index could not be checked. AsterMargin will try again.")}
            </div>}
            {issueCount > 0 && <div className="text-base font-color-secondary mt-2" style={{ paddingLeft: '22px' }}>
                {status.error && settingsText("Last reported: ")}{settingsText(problemMessage, { files: plural(issueCount, 'file') })}{' '}
                <button type="button" className="text-link cursor-pointer" onClick={onShowProblems}
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
                    {settingsText("See Problems")}
                </button>
            </div>}
        </div>
    );
};

/**
 * Restores cached text that was evicted from the local document cache. The
 * cache is separate from the search index: eviction never removes a file from
 * search, and restoring only makes responses faster. Offered once processing
 * is settled, so the rebuild does not compete with pending work.
 */
const CachedTextRow: React.FC<{ processing: boolean; onRebuild: () => void }> = ({ processing, onRebuild }) => (
    <SettingsRow
        hasBorder
        announceDescription
        title={settingsText("Cached text")}
        description={settingsText("Some processed files are no longer cached. Rebuilding prepares them again for faster responses.")}
        control={
            <Button
                variant="outline"
                rightIcon={PlayIcon}
                onClick={onRebuild}
                disabled={processing}
                loading={processing}
            >
                {settingsText("Rebuild cache")}
            </Button>
        }
    />
);

/**
 * Title and description of the setting, from what the account is entitled to.
 * A locked setting names only the features that lock it, so a user reads about
 * full-text search or OCR only when they have it.
 */
function describeSetting(
    hasSearchAccess: boolean,
    hasOcrAccess: boolean,
    locked: boolean,
): { title: string; description: string } {
    const title = hasSearchAccess ? settingsText("Keep Full-Text Search Up to Date") : settingsText("Process Files in the Background");
    if (!locked) {
        return { title, description: settingsText("Process files ahead of time while your computer is idle for faster responses.") };
    }
    const search = settingsText("full-text search");
    const features = hasSearchAccess && hasOcrAccess
        ? settingsText("{a} and {b}", { a: search, b: "OCR" })
        : hasSearchAccess ? search : "OCR";
    return {
        title,
        description: settingsText("AsterMargin reads new and changed files while your computer is idle. Required for {features}.", { features }),
    };
}

/** True while the local metadata search index has something to fix. */
function hasMetadataIndexProblem(indexState: EmbeddingIndexState): boolean {
    return indexState.failedItems > 0 || (indexState.status === 'error' && Boolean(indexState.error));
}

/**
 * Items the local metadata search index could not embed. The index maintains
 * itself, so this row appears only while there is something to fix.
 */
const MetadataIndexProblemRow: React.FC<{ indexState: EmbeddingIndexState }> = ({ indexState }) => {
    const isIndexing = useAtomValue(isEmbeddingIndexingAtom);
    const forceReindex = useSetAtom(forceReindexAtom);
    const failed = indexState.failedItems > 0;
    const errored = indexState.status === 'error' && Boolean(indexState.error);
    if (!failed && !errored) return null;
    return (
        <SettingsRow
            hasBorder
            announceDescription
            title={failed
                ? settingsText("{items} missing from metadata search", { items: plural(indexState.failedItems, "item") })
                : settingsText("Metadata search index needs attention")}
            description={errored
                ? settingsText("The last index update failed: {detail}", { detail: indexState.error ?? "" })
                : settingsText("These items could not be added to the local index that powers searching by title and abstract.")}
            control={
                <Button
                    variant="outline"
                    onClick={() => { if (!isIndexing) forceReindex(); }}
                    disabled={isIndexing}
                    loading={isIndexing}
                >
                    {isIndexing ? settingsText("Rebuilding…") : settingsText("Rebuild")}
                </Button>
            }
        />
    );
};

export default function BackgroundProcessingSection(): React.ReactElement | null {
    const consent = useAtomValue(cloudConsentAtom);
    const hasOcrAccess = useAtomValue(hasOcrAccessAtom);
    const hasSearchAccess = useAtomValue(hasSearchIndexAccessAtom);
    const cloudRequired = hasOcrAccess || hasSearchAccess;
    const locked = cloudRequired && consent === 'accepted';
    const snapshot = useAtomValue(backgroundProcessingStatusAtom);
    // Entitlements may change before the next status snapshot arrives.
    const status = hasSearchAccess ? snapshot : {
        ...snapshot,
        issues: snapshot.issues.filter((group) => group.reason !== 'index_failed'),
    };
    const problemsHeading = useRef<HTMLSpanElement>(null);
    const showProblems = () => {
        problemsHeading.current?.scrollIntoView({ block: 'start' });
        problemsHeading.current?.focus({ preventScroll: true });
    };
    const indexState = useAtomValue(embeddingIndexStateAtom);
    const [enabled, setEnabled] = useState(
        () => getPref('backgroundProcessingEnabled') === true,
    );
    const working = (status.worker?.inFlight ?? 0) > 0 || status.worker?.drainNow === true;
    const refresh = useBackgroundProcessingStatus({
        includeCoverage: hasSearchAccess,
        includeFailures: true,
        // Poll faster while files are being processed so the bar keeps up.
        pollIntervalMs: working ? 4_000 : 15_000,
    });

    useEffect(() => {
        let observer: symbol | null = null;
        try {
            observer = Zotero.Prefs.registerObserver(
                'extensions.zotero.astermargin.backgroundProcessingEnabled',
                () => setEnabled(getPref('backgroundProcessingEnabled') === true),
                true,
            );
        } catch { /* preferences may be closing */ }
        return () => {
            if (observer === null) return;
            try { Zotero.Prefs.unregisterObserver(observer); } catch { /* best effort */ }
        };
    }, []);

    const updateEnabled = (next: boolean) => {
        if (locked) return;
        setEnabled(next);
        setPref('backgroundProcessingEnabled', next);
        if (!next) Zotero.AsterMargin?.backgroundExtractor?.cancelImmediateDrain();
        Zotero.AsterMargin?.processingReconciler?.notify();
        Zotero.AsterMargin?.backgroundExtractor?.notify();
    };

    const [actionError, setActionError] = useState<string | null>(null);

    /** Start pending work or explicitly rebuild cached text, according to the clicked action. */
    const [processing, setProcessing] = useState(false);
    const processNow = async (action: 'start' | 'rebuild') => {
        if (processing) return;
        setProcessing(true);
        setActionError(null);
        const report = (error: unknown) => setActionError((current) =>
            current ?? (error instanceof Error ? error.message : settingsText("Could not start processing.")));
        try {
            if (action === 'rebuild') {
                await prepareUncachedFiles().catch(report);
            }
            // Starting the waiting queue must not force a library-wide source
            // recheck, which also retries settled availability failures.
            Zotero.AsterMargin?.backgroundExtractor?.requestImmediateDrain();
            await refresh();
        } finally {
            setProcessing(false);
        }
    };

    const stopDrain = async () => {
        Zotero.AsterMargin?.backgroundExtractor?.cancelImmediateDrain();
        await refresh();
    };

    /**
     * Requeue attachments from an issue group; `refs === null` retries the
     * whole group. The reconciler resets the failed stage and drains at once,
     * so the refreshed status shows the files running rather than listed.
     */
    const retryIssues = async (reason: ProcessingIssueReason, refs: AttachmentRef[] | null) => {
        const reconciler = Zotero.AsterMargin?.processingReconciler;
        const db = Zotero.AsterMargin?.db;
        if (!reconciler || !db) return;
        setActionError(null);
        try {
            const targets = refs ?? await db.getProcessingIssueRefs(
                { hasOcrAccess, hasSearchIndexAccess: hasSearchAccess }, reason,
            );
            if (targets.length > 0) await reconciler.retryAttachments(targets);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : settingsText("Could not retry these files."));
        }
        await refresh();
    };

    const issueCount = status.issues.reduce((sum, group) => sum + group.count, 0);
    const indexIssueCount = status.issues.find((group) => group.reason === 'index_failed')?.count ?? 0;
    // The status poll keeps the last successful check when a later one fails,
    // so a failed check is reported rather than hidden behind the stale result.
    const searchIndexUnavailable = hasSearchAccess && status.coverageError !== null;
    const searchIndexUpToDate = hasSearchAccess
        && !searchIndexUnavailable
        && status.coverage?.namespace_exists === true
        && indexIssueCount === 0;
    const metadataProblem = hasMetadataIndexProblem(indexState);
    const setting = describeSetting(hasSearchAccess, hasOcrAccess, locked);
    const sentence = describeStatus(status, { searchIndexUpToDate });
    const showStatus = enabled || (status.worker?.inFlight ?? 0) > 0;
    const canRestoreCache = enabled
        && sentence.tone === 'idle'
        && status.documentCache?.can_prepare_uncached_files === true;
    const problemsSummary: React.ReactNode = status.error
        ? settingsText("Could not update the list of problems. Previously reported problems are shown below.")
        : status.updatedAt === null
            ? metadataProblem ? settingsText("Checking files for problems…") : settingsText("Checking for problems…")
            : issueCount > 0
                ? settingsText("Of the files AsterMargin has processed so far, {files} could not be read or indexed.", { files: plural(issueCount, "attachment") })
                : metadataProblem
                    ? settingsText("All files AsterMargin has processed so far were read. Metadata search needs attention.")
                    : settingsText("No problems found in the files AsterMargin has processed so far.");

    return (
        <>
            <SectionLabel>{settingsText("Background Processing")}</SectionLabel>
            <SettingsGroup>
                <SettingsRow
                    title={setting.title}
                    description={setting.description}
                    onClick={() => updateEnabled(!enabled)}
                    control={<SettingsSwitch
                        aria-label={hasSearchAccess ? settingsText("Keep full-text search up to date") : settingsText("Process files in the background")}
                        disabled={locked}
                        checked={enabled}
                        onChange={updateEnabled}
                    />}
                />
                {showStatus && (
                    <ProcessingStatusRow
                        status={status}
                        sentence={sentence}
                        processing={processing}
                        onProcessNow={() => processNow('start')}
                        onStopDrain={stopDrain}
                        onShowProblems={showProblems}
                        searchIndexUnavailable={searchIndexUnavailable}
                    />
                )}
                {canRestoreCache && (
                    <CachedTextRow processing={processing} onRebuild={() => processNow('rebuild')} />
                )}
                {actionError && <div role="alert" className="font-color-red text-base border-top-quinary" style={{ padding: '8px 12px' }}>{actionError}</div>}
            </SettingsGroup>

            <SectionLabel><span ref={problemsHeading} tabIndex={-1}>{settingsText("Problems")}</span></SectionLabel>
            <SettingsGroup>
                <div className="font-color-secondary text-base" style={{ padding: '8px 12px' }}>
                    {problemsSummary}
                </div>
                {status.issues.map((group) => (
                    <ProcessingIssueGroupRow
                        key={group.reason}
                        group={group}
                        hasOcrAccess={hasOcrAccess}
                        hasSearchAccess={hasSearchAccess}
                        issuesUpdatedAt={status.issuesUpdatedAt}
                        hasBorder
                        onRetry={retryIssues}
                    />
                ))}
                <MetadataIndexProblemRow indexState={indexState} />
            </SettingsGroup>
            <div className="text-sm font-color-secondary mt-2" style={{ paddingLeft: '4px' }}>
                <ExternalLink href="mailto:contact@astermarginapp.ai?subject=AsterMargin%20file%20problem" className="text-sm">
                    {settingsText("Report a file processing problem by email.")}
                </ExternalLink>
            </div>
        </>
    );
}
