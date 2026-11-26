/**
 * Render helpers for /command tokens in stored user messages.
 *
 * Pill data (`command`, `title`, `prompt`, `category`) is self-contained in
 * the prompt's `actions` field, so rendering stays pure and client-agnostic —
 * the hover card is built entirely from persisted data. The only
 * client-specific behavior (clicking a pill to edit the action) goes through
 * the optional `navigation.openActionSettings` host method. The token
 * matching itself lives in the React-free `@astermargin/agent-ui/composer/slashCommands`.
 */

import React from 'react';
import type { PromptAction } from '@astermargin/agent-core/agents/types';
import { splitContentBySlashTokens } from '@astermargin/agent-ui/composer/slashCommands';
import { ChipWithPopup } from '@astermargin/agent-ui/chat/ChipPopup';
import { buildActionPopup } from '@astermargin/agent-ui/chat/actionPopup';
import { highlightText } from '@astermargin/agent-ui/chat/highlightText';
import { findMatchRanges, type FindQuery } from '@astermargin/agent-ui/chat/findContext';
import { getHost } from '@astermargin/agent-ui/host';
import { actionDisplayText } from '../../utils/actionDisplayText';

/**
 * Render message content with recognized `/command` tokens styled as pills.
 * Plain-text segments are emitted as-is (the parent preserves whitespace via
 * `white-space: pre-wrap`); unmatched or malformed tokens degrade to raw text.
 *
 * Each pill shows a hover card (action title, prompt preview, edit hint).
 * When the host exposes an action editor (`navigation.openActionSettings`),
 * clicking a pill opens the action there — stopping propagation so it doesn't
 * also trigger the surrounding message's click-to-edit behavior. Hosts without
 * one degrade to hover-only: no click affordance, no edit-hint footer, and
 * clicks bubble to the surrounding message as usual.
 *
 * @param findQuery Active find-in-chat query, or `''`. Passed in rather than
 *                  read from the find context so this stays a plain function.
 *                  Only the prose segments are highlighted: a pill's label is a
 *                  command token, not text the user wrote, and a `<mark>` inside
 *                  the chip would fight its own styling.
 */
export function renderContentWithSlashPills(
    content: string,
    actions: PromptAction[],
    findQuery: FindQuery = '',
): React.ReactNode[] {
    const canEditActions = Boolean(getHost().navigation?.openActionSettings);
    return splitContentBySlashTokens(content, actions).map((segment, i) => {
        const action = segment.action;
        if (!action) {
            // `highlightText` hands back the string itself when there is no
            // query or no match, so the no-find rendering is untouched.
            return <React.Fragment key={i}>{highlightText(segment.text, findQuery, `find-${i}`)}</React.Fragment>;
        }
        const displayAction = { id: action.action_id, title: action.title ?? "", description: action.description };
        const popup = buildActionPopup({
            title: action.title === undefined ? undefined : actionDisplayText(displayAction, 'title'),
            command: action.command,
            description: actionDisplayText(displayAction, 'description'),
            prompt: action.prompt,
            category: action.category,
        });
        if (!canEditActions) popup.action = null;
        return (
            <ChipWithPopup key={i} popup={popup}>
                <span
                    className={`astermargin-slash-command${canEditActions ? ' astermargin-slash-command-clickable' : ''}`}
                    onClick={canEditActions ? (e) => {
                        // Gecko dispatches click for non-primary buttons too.
                        if (e.button !== 0) return;
                        e.stopPropagation();
                        getHost().navigation?.openActionSettings?.(action.action_id);
                    } : undefined}
                >
                    {segment.text}
                </span>
            </ChipWithPopup>
        );
    });
}

/**
 * Whether a find query matches text this message actually shows as prose.
 *
 * Mirrors the rule above — pill labels are never highlighted — so a caller
 * cannot conclude a message holds a visible hit that no renderer produces.
 */
export function hasProseFindMatch(
    content: string,
    actions: PromptAction[],
    findQuery: FindQuery,
): boolean {
    if (findQuery.length === 0) return false;
    if (actions.length === 0) return findMatchRanges(content, findQuery).length > 0;
    return splitContentBySlashTokens(content, actions).some(
        segment => !segment.action && findMatchRanges(segment.text, findQuery).length > 0,
    );
}
