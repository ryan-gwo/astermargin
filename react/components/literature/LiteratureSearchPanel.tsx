import React, { useMemo, useState } from "react";
import Button from "@astermargin/agent-ui/primitives/Button";
import { settingsText } from "../../utils/settingsText";
import {
    applyMetadataChanges,
    findExistingLiteratureItem,
    metadataChangesForRecord,
    type LiteratureProvider,
    type LiteratureRecord,
    searchLiterature,
} from "../../../src/services/literatureIndex";

interface PendingAction {
    record: LiteratureRecord;
    existing: Zotero.Item | null;
}

function recordLabel(record: LiteratureRecord): string {
    return [record.authors.slice(0, 2).join(", "), record.year, record.venue].filter(Boolean).join(" · ");
}

export default function LiteratureSearchPanel({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [providers, setProviders] = useState<Record<LiteratureProvider, boolean>>({ arxiv: true, ads: true });
    const [results, setResults] = useState<LiteratureRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const selectedProviders = useMemo(() => (Object.entries(providers)
        .filter(([, enabled]) => enabled)
        .map(([provider]) => provider) as LiteratureProvider[]), [providers]);

    async function runSearch() {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            setResults(await searchLiterature(query, { providers: selectedProviders, limit: 12 }));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setLoading(false);
        }
    }

    async function prepare(record: LiteratureRecord) {
        setMessage(null);
        setError(null);
        try {
            const existing = await findExistingLiteratureItem(record, [Zotero.Libraries.userLibraryID]);
            setPending({ record, existing });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    }

    async function confirm() {
        if (!pending) return;
        const { record, existing } = pending;
        try {
            if (existing) {
                const changes = await applyMetadataChanges(existing, record);
                setMessage(settingsText("Updated the original Zotero item. The preprint attachment and annotations were kept.") + (changes.length ? ` ${changes.length}` : ""));
            } else {
                await Zotero.AsterMargin.itemImport.write({
                    library_id: Zotero.Libraries.userLibraryID,
                    source: {
                        kind: "identifier",
                        input: record.arxivId ? `arxiv:${record.arxivId}` : record.doi ? `doi:${record.doi}` : record.id,
                        provider: record.provider,
                        external_id: record.id,
                        ...(record.arxivId ? { identifier: { type: "arxiv", value: record.arxivId } } : record.doi ? { identifier: { type: "doi", value: record.doi } } : {}),
                    },
                    item: record.item,
                    pdf_candidates: record.pdfUrl ? [{ url: record.pdfUrl, access_method: record.provider }] : [],
                });
                setMessage(settingsText("Imported the paper into My Library. The PDF will be added when available."));
            }
            setPending(null);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        }
    }

    return (
        <div className="display-flex flex-col gap-2 rounded-card border-card bg-senary p-3">
            <div className="display-flex flex-row items-center justify-between">
                <h2 className="text-lg font-color-primary font-semibold" style={{ margin: 0 }}>{settingsText("Physics literature search")}</h2>
                <Button variant="ghost-secondary" onClick={onClose}>{settingsText("Close")}</Button>
            </div>
            <div className="display-flex flex-row gap-2">
                <input
                    className="chat-input flex-1"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Enter") void runSearch(); }}
                    placeholder={settingsText("Search arXiv and NASA ADS")}
                    aria-label={settingsText("Search arXiv and NASA ADS")}
                />
                <Button variant="solid" loading={loading} disabled={!query.trim() || selectedProviders.length === 0} onClick={() => void runSearch()}>
                    {settingsText("Search")}
                </Button>
            </div>
            <div className="display-flex flex-row flex-wrap gap-3 text-sm font-color-secondary">
                {(["arxiv", "ads"] as const).map((provider) => (
                    <label key={provider} className="display-flex flex-row items-center gap-1">
                        <input
                            type="checkbox"
                            checked={providers[provider]}
                            onChange={(event) => setProviders((current) => ({ ...current, [provider]: event.target.checked }))}
                        />
                        {provider === "arxiv" ? "arXiv" : "NASA ADS"}
                    </label>
                ))}
            </div>
            {error && <div role="alert" className="font-color-error text-sm">{error}</div>}
            {message && <div role="status" className="font-color-green text-sm">{message}</div>}
            {results.length > 0 && (
                <div className="display-flex flex-col gap-1">
                    {results.map((record) => (
                        <div key={`${record.provider}:${record.id}`} className="display-flex flex-row items-start gap-2 border-top-quinary py-2">
                            <div className="display-flex flex-col flex-1 min-w-0">
                                <div className="font-color-primary font-medium">{record.title}</div>
                                <div className="text-sm font-color-secondary">{recordLabel(record)} · {record.provider === "arxiv" ? `arXiv:${record.arxivId}` : record.bibcode}</div>
                                {record.abstract && <div className="text-sm font-color-tertiary" style={{ maxHeight: "3.2em", overflow: "hidden" }}>{record.abstract}</div>}
                            </div>
                            <Button variant="outline" onClick={() => void prepare(record)}>{settingsText("Preview import")}</Button>
                        </div>
                    ))}
                </div>
            )}
            {pending && (
                <div className="rounded-md border-card p-2" role="dialog" aria-label={settingsText("Import preview")}>
                    <div className="font-color-primary font-medium">{pending.existing ? settingsText("Update original item") : settingsText("Import into My Library")}</div>
                    <div className="text-sm font-color-secondary">{pending.record.title}</div>
                    {pending.existing ? (
                        <ul className="text-sm font-color-secondary">
                            {metadataChangesForRecord(pending.existing, pending.record).map((change) => <li key={change.field}>{change.field}: {change.before || "—"} → {change.after}</li>)}
                        </ul>
                    ) : (
                        <div className="text-sm font-color-secondary">{settingsText("The existing preprint attachment and annotations remain. A journal PDF can be added later without creating a duplicate item.")}</div>
                    )}
                    <div className="display-flex flex-row gap-2 mt-2">
                        <Button variant="solid" onClick={() => void confirm()}>{settingsText("Confirm and write")}</Button>
                        <Button variant="ghost-secondary" onClick={() => setPending(null)}>{settingsText("Cancel")}</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
