export interface SemanticModelCandidate {
    id: string;
    label: string;
    local: boolean;
    status: "installed" | "evaluation";
    notes: string;
}

/** Candidates are recorded for a reproducible comparison before changing the
 * shipped default or downloading another model into the user's profile. */
export const semanticModelCandidates: readonly SemanticModelCandidate[] = [
    {
        id: "multilingual-e5-small",
        label: "multilingual-e5-small",
        local: true,
        status: "installed",
        notes: "Current bundled multilingual baseline.",
    },
    {
        id: "Qwen3-Embedding-0.6B",
        label: "Qwen3-Embedding-0.6B",
        local: true,
        status: "evaluation",
        notes: "Candidate for stronger cross-language astronomy retrieval.",
    },
];
