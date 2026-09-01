import { getMechAnalyticsUrl } from './config';
import type { RequesterMetricsResponse, ScoredRow, ScoredRowsResponse } from './types';

const DEFAULT_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 30_000;

export class MechAnalyticsError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MechAnalyticsError';
    this.status = status;
  }
}

interface FetchRowsParams {
  chainId: number;
  requester?: string;
  // ``delivery_mech`` filters on the mech that actually delivered.
  // Consumers rendering "requests this mech served" (Supply activity)
  // use this. Available on mech-analytics since alembic 017.
  //
  // A ``mechAddress`` param (mapping to the API's ``?mech_address=``
  // filter on ``priority_mech``) was intentionally dropped from this
  // interface: nothing in the app queries priority_mech and having
  // both fields with opposite semantics (routed-to vs
  // actually-delivered) is a copy-paste footgun that would silently
  // reintroduce the mislabel ``delivery_mech`` was added to fix. Add
  // it back when a caller genuinely needs the priority-mech filter.
  deliveryMech?: string;
  // ``asc`` (oldest first, historical default) or ``desc`` (newest
  // first). Newest-first is what any "recent activity" feed wants —
  // page 1 = the most recent ``limit`` rows. Direction is locked
  // into the cursor for the rest of the pagination on the server.
  sortDirection?: 'asc' | 'desc';
  // Sort axis on the mech-analytics side. Default is ``computed_at``
  // (when the row was scored) which is fine for fresh rows but
  // degenerates on the ``ipfs_historical`` backfill — every backfill
  // row shares one ``computed_at`` (the moment the backfill wrote
  // them), so DESC on that axis falls to a ``request_id`` tiebreak
  // that has no time meaning. ``requested_at`` (the actual per-row
  // request time predict-api recorded) is populated on every source
  // and gives genuine newest-by-request-time across
  // ``mech_onchain`` / ``mech_offchain`` / ``ipfs_historical``.
  // Available on mech-analytics since PR#40 (v0.0.20).
  sort?: 'requested_at' | 'computed_at';
}

// Yielded page shape carries the ``nextCursor`` for that page so
// callers with their own page cap (fetchCapped in service-activity.ts)
// can distinguish "cap hit AND more rows exist upstream" from
// "cap hit exactly at exhaustion" — the latter must not surface a
// spurious hasMore banner.
export type ScoredRowPage = {
  rows: ScoredRow[];
  nextCursor: string | null;
};

async function* iterateRows(
  endpoint: 'scored-rows' | 'unscored-rows',
  params: FetchRowsParams,
): AsyncGenerator<ScoredRowPage, void, void> {
  const { chainId, sortDirection, sort } = params;
  const requester = params.requester?.toLowerCase();
  const deliveryMech = params.deliveryMech?.toLowerCase();

  let cursor: string | null = null;

  while (true) {
    const url = new URL(`${getMechAnalyticsUrl()}/v1/data/${endpoint}`);
    url.searchParams.set('chain_id', String(chainId));
    if (requester) url.searchParams.set('requester', requester);
    if (deliveryMech) url.searchParams.set('delivery_mech', deliveryMech);
    if (sortDirection) url.searchParams.set('sort_direction', sortDirection);
    if (sort) url.searchParams.set('sort', sort);
    url.searchParams.set('limit', String(DEFAULT_LIMIT));
    if (cursor !== null) {
      url.searchParams.set('cursor', cursor);
    }

    const response = await fetchWithTimeout<ScoredRowsResponse>(url.toString());
    if (!response.ok || !response.body) {
      throw new MechAnalyticsError(
        `mech-analytics ${endpoint} failed: HTTP ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    yield { rows: response.body.rows, nextCursor: response.body.next_cursor };

    cursor = response.body.next_cursor;
    if (!cursor) {
      return;
    }
  }
}

export const iterateScoredRows = (params: FetchRowsParams) => iterateRows('scored-rows', params);
export const iterateUnscoredRows = (params: FetchRowsParams) =>
  iterateRows('unscored-rows', params);

export async function fetchRequesterMetrics(
  chainId: number,
  requester: string,
): Promise<RequesterMetricsResponse> {
  const url = `${getMechAnalyticsUrl()}/v1/metrics/requester/${chainId}/${requester.toLowerCase()}`;
  const response = await fetchWithTimeout<RequesterMetricsResponse>(url);
  if (!response.ok || !response.body) {
    throw new MechAnalyticsError(
      `mech-analytics requester metrics failed: HTTP ${response.status} ${response.statusText}`,
      response.status,
    );
  }
  return response.body;
}

type FetchResult<T> = {
  ok: boolean;
  status: number;
  statusText: string;
  body: T | null;
};

// Aborts headers-in AND body-read. The prior shape cleared the timer
// as soon as headers arrived, so a stalled ``response.json()`` could
// hang the serverless function until the platform killed it. Both
// phases now share the same 30 s budget — the body read happens
// under the same abort signal, so a stall trips the timeout, aborts
// the stream, and rejects the read.
async function fetchWithTimeout<T>(url: string): Promise<FetchResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    let body: T | null = null;
    if (response.ok) {
      body = (await response.json()) as T;
    }
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}
