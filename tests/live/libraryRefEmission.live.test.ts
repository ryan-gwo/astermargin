/**
 * Live tests asserting that `library_ref` is emitted through every production
 * data-provider handler and serializer the identity change touched, for both
 * personal ("u") and group ("g<groupID>") items. `libraryRefForLibraryID()` is
 * injected into the serializer/funnel sites, and these tests confirm the funnels
 * still produce correct output and stamp the portable ref.
 *
 * Handlers covered: /astermargin/library/libraries, /library/list, /library/search,
 * /library/metadata, /library/collections, /library/find-annotations, and
 * /astermargin/zotero-data (serializeItem / serializeAttachment).
 *
 * Prerequisites: dev build running + authenticated. Group-library assertions
 * skip automatically when no group library is present.
 * Run: npm run test:live -- libraryRefEmission
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { isZoteroAvailable, skipIfNoZotero } from '../helpers/zoteroAvailability';
import { post } from '../helpers/zoteroHttpClient';
import {
    getLibraryTopology,
    firstItemKey,
    firstItemId,
    type LibraryTopology,
} from '../helpers/libraryTopology';

interface ItemRow { item_id: string; library_ref?: string; result_type?: string }
interface ListResponse { items: ItemRow[]; error?: string | null; library_name?: string }
interface SearchResponse { items: ItemRow[]; total_count: number; error?: string | null }
interface MetadataResponse { items: Array<{ item_id: string; library_ref?: string }>; error?: string | null }
interface CollectionsResponse {
    collections: Array<{ collection_key: string; library_ref?: string | null; library_id?: number }>;
    error?: string | null;
}
interface AnnotationsResponse {
    annotations: Array<{ annotation_id: string; library_ref?: string }>;
    total_count: number;
    error?: string | null;
}
interface ZoteroDataResponse {
    items: Array<{ item: { library_ref?: string; library_id?: number } }>;
    attachments: Array<{ attachment: { library_ref?: string; library_id?: number } }>;
    errors?: unknown[];
}
interface ValidateResponse {
    valid: boolean;
    error?: string | null;
    error_code?: string | null;
    current_value?: Record<string, unknown>;
    normalized_action_data?: { item_ids?: string[] };
}

let available: boolean;
let topo: LibraryTopology;
let personalKey: string | null = null;
let groupItemId: string | null = null;

beforeAll(async () => {
    available = await isZoteroAvailable();
    if (!available) {
        console.warn('\n⚠  Zotero not available — libraryRefEmission live tests will be skipped.\n');
        return;
    }
    topo = await getLibraryTopology();
    personalKey = await firstItemKey(topo.personal.library_id);
    if (topo.group) groupItemId = await firstItemId(topo.group.library_id);
});

describe('/astermargin/library/libraries', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('emits "u" for the personal library and a "g<id>" ref for every group', async () => {
        const res = await post<{ libraries: LibraryTopology['personal'][] }>('/astermargin/library/libraries', {});
        for (const lib of res.libraries) {
            if (lib.is_group) {
                expect(lib.library_ref).toMatch(/^g[1-9][0-9]*$/);
            } else {
                expect(lib.library_ref).toBe('u');
            }
        }
    });
});

describe('/astermargin/library/list', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('stamps "u" on personal-library items', async () => {
        const res = await post<ListResponse>('/astermargin/library/list', { library_id: topo.personal.library_id, limit: 5 });
        expect(res.error ?? null).toBeNull();
        expect(res.items.length).toBeGreaterThan(0);
        for (const item of res.items) expect(item.library_ref).toBe('u');
    });

    it('stamps the group ref on group-library items', async (ctx) => {
        if (!topo.group) return ctx.skip();
        const res = await post<ListResponse>('/astermargin/library/list', { library_id: topo.group.library_id, limit: 5 });
        expect(res.error ?? null).toBeNull();
        expect(res.items.length).toBeGreaterThan(0);
        for (const item of res.items) expect(item.library_ref).toBe(topo.group.library_ref);
    });
});

describe('/astermargin/library/search', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('stamps the group ref on search-result rows', async (ctx) => {
        if (!topo.group) return ctx.skip();
        const res = await post<SearchResponse>('/astermargin/library/search', {
            library_id: topo.group.library_id,
            conditions: [{ field: 'title', operator: 'contains', value: 'e' }],
            limit: 5,
        });
        expect(res.error ?? null).toBeNull();
        if (res.items.length === 0) return ctx.skip();
        for (const item of res.items) expect(item.library_ref).toBe(topo.group.library_ref);
    });
});

describe('/astermargin/library/metadata', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('stamps the right ref on each item across libraries', async (ctx) => {
        if (!personalKey) return ctx.skip();
        const ids = [`${topo.personal.library_id}-${personalKey}`];
        if (groupItemId) ids.push(groupItemId);
        const res = await post<MetadataResponse>('/astermargin/library/metadata', { item_ids: ids });
        expect(res.error ?? null).toBeNull();
        const byId = new Map(res.items.map((it) => [it.item_id, it.library_ref]));
        expect(byId.get(`u-${personalKey}`)).toBe('u');
        if (groupItemId) expect(byId.get(groupItemId)).toBe(topo.group!.library_ref);
    });
});

describe('/astermargin/library/collections', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('stamps the group ref on each collection row', async (ctx) => {
        if (!topo.group) return ctx.skip();
        const res = await post<CollectionsResponse>('/astermargin/library/collections', { library_id: topo.group.library_id, limit: 10 });
        expect(res.error ?? null).toBeNull();
        if (res.collections.length === 0) return ctx.skip();
        for (const coll of res.collections) expect(coll.library_ref).toBe(topo.group.library_ref);
    });
});

describe('/astermargin/library/find-annotations', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('stamps the group ref on annotation rows', async (ctx) => {
        if (!topo.group) return ctx.skip();
        const res = await post<AnnotationsResponse>('/astermargin/library/find-annotations', { library_id: topo.group.library_id, limit: 5 });
        expect(res.error ?? null).toBeNull();
        if (res.annotations.length === 0) return ctx.skip();
        for (const ann of res.annotations) expect(ann.library_ref).toBe(topo.group.library_ref);
    });
});

describe('/astermargin/zotero-data (serializeItem / serializeAttachment)', () => {
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('stamps "u" on a serialized personal item', async (ctx) => {
        if (!personalKey) return ctx.skip();
        const res = await post<ZoteroDataResponse>('/astermargin/zotero-data', {
            items: [{ library_id: topo.personal.library_id, zotero_key: personalKey }],
            include_attachments: true,
            include_parents: false,
        });
        // The handler omits `errors` entirely when there are none.
        expect(res.errors ?? []).toEqual([]);
        for (const w of res.items) expect(w.item.library_ref).toBe('u');
        for (const w of res.attachments) expect(w.attachment.library_ref).toBe('u');
    });

    it('stamps the group ref on a serialized group item and its attachments', async (ctx) => {
        if (!groupItemId) return ctx.skip();
        // item ids are emitted in the portable "g<groupID>-<key>" form, so take
        // the key from the id and address the library by its device-local id.
        const zotero_key = groupItemId.slice(groupItemId.indexOf('-') + 1);
        const res = await post<ZoteroDataResponse>('/astermargin/zotero-data', {
            items: [{ library_id: topo.group!.library_id, zotero_key }],
            include_attachments: true,
            include_parents: false,
        });
        // The handler omits `errors` entirely when there are none.
        expect(res.errors ?? []).toEqual([]);
        for (const w of res.items) expect(w.item.library_ref).toBe(topo.group!.library_ref);
        for (const w of res.attachments) expect(w.attachment.library_ref).toBe(topo.group!.library_ref);
    });
});

describe('/astermargin/agent-action/validate (organize_items normalization)', () => {
    // organize_items validation is read-only (it only snapshots current state, never
    // saves), so it is safe to run against real items. It must return device-portable
    // item_ids in normalized_action_data so the backend persists + replays them.
    beforeEach((ctx) => skipIfNoZotero(ctx, available));

    it('normalizes a personal item id to the portable "u-" form', async (ctx) => {
        if (!personalKey) return ctx.skip();
        const res = await post<ValidateResponse>('/astermargin/agent-action/validate', {
            action_type: 'organize_items',
            action_data: {
                item_ids: [`${topo.personal.library_id}-${personalKey}`],
                tags: { add: ['astermargin-live-test-tag'], remove: [] },
                collections: null,
            },
        });
        expect(res.valid).toBe(true);
        expect(res.normalized_action_data?.item_ids?.[0]).toBe(`u-${personalKey}`);
        // current_value is keyed by the same portable id (for consistent undo).
        expect(Object.keys(res.current_value ?? {})).toContain(`u-${personalKey}`);
    });

    it('accepts an already-portable "u-<key>" id and normalizes it back to itself (dual-format)', async (ctx) => {
        if (!personalKey) return ctx.skip();
        const res = await post<ValidateResponse>('/astermargin/agent-action/validate', {
            action_type: 'organize_items',
            action_data: {
                item_ids: [`u-${personalKey}`],
                tags: { add: ['astermargin-live-test-tag'], remove: [] },
                collections: null,
            },
        });
        expect(res.valid).toBe(true);
        expect(res.normalized_action_data?.item_ids?.[0]).toBe(`u-${personalKey}`);
    });

    it('normalizes a group item id to the portable "g<id>-" form', async (ctx) => {
        if (!groupItemId || !topo.group) return ctx.skip();
        const res = await post<ValidateResponse>('/astermargin/agent-action/validate', {
            action_type: 'organize_items',
            action_data: {
                item_ids: [groupItemId],
                tags: { add: ['astermargin-live-test-tag'], remove: [] },
                collections: null,
            },
        });
        // A read-only group would fail validation for an unrelated reason; only
        // assert normalization when validation succeeds.
        if (!res.valid) return ctx.skip();
        const key = groupItemId.slice(groupItemId.indexOf('-') + 1);
        expect(res.normalized_action_data?.item_ids?.[0]).toBe(`${topo.group.library_ref}-${key}`);
    });
});
