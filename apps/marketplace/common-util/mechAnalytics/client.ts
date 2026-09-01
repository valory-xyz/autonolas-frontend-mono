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
  // ``mech_address`` filters on priority_mech (the routed mech).
  mechAddress?: string;
  // ``delivery_mech`` filters on the mech that actually delivered.
  // Consumers rendering "requests this mech served" (Supply activity)
  // MUST use this and not ``mechAddress``: under the non-priority
  // delivery path, priority ≠ delivery. Available on mech-analytics
  // since alembic 017.
  deliveryMech?: string;
  // ``asc`` (oldest first, historical default) or ``desc`` (newest
  // first). Newest-first is what any "recent activity" feed wants —
  // page 1 = the most recent ``limit`` rows. Direction is locked
  // into the cursor for the rest of the pagination on the server.
  sortDirection?: 'asc' | 'desc';
}

async function* iterateRows(
  endpoint: 'scored-rows' | 'unscored-rows',
  params: FetchRowsParams,
): AsyncGenerator<ScoredRow[], void, void> {
  const { chainId, sortDirection } = params;
  const requester = params.requester?.toLowerCase();
  const mechAddress = params.mechAddress?.toLowerCase();
  const deliveryMech = params.deliveryMech?.toLowerCase();

  let cursor: string | null = null;

  while (true) {
    const url = new URL(`${getMechAnalyticsUrl()}/v1/data/${endpoint}`);
    url.searchParams.set('chain_id', String(chainId));
    if (requester) url.searchParams.set('requester', requester);
    if (mechAddress) url.searchParams.set('mech_address', mechAddress);
    if (deliveryMech) url.searchParams.set('delivery_mech', deliveryMech);
    if (sortDirection) url.searchParams.set('sort_direction', sortDirection);
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

    yield response.body.rows;

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
