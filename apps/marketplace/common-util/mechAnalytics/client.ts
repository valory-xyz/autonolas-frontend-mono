import { getMechAnalyticsUrl } from './config';
import type { RequesterMetricsResponse, ScoredRow, ScoredRowsResponse } from './types';

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 5000;
const DEFAULT_MAX_PAGES = 100;
const DEFAULT_TIMEOUT_MS = 30_000;

export class MechAnalyticsError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'MechAnalyticsError';
    this.status = status;
  }
}

interface FetchScoredRowsParams {
  chainId: number;
  requester: string;
  limit?: number;
  maxPages?: number;
  signal?: AbortSignal;
}

export async function* iterateScoredRows(
  params: FetchScoredRowsParams,
): AsyncGenerator<ScoredRow[], void, void> {
  const { chainId, requester, signal } = params;
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const maxPages = params.maxPages ?? DEFAULT_MAX_PAGES;

  let cursor: string | null = null;
  let pageCount = 0;

  while (true) {
    if (pageCount >= maxPages) {
      throw new MechAnalyticsError(
        `mech-analytics scored-rows: hit max_pages=${maxPages} without exhausting the cursor`,
      );
    }

    const url = new URL(`${getMechAnalyticsUrl()}/v1/data/scored-rows`);
    url.searchParams.set('chain_id', String(chainId));
    url.searchParams.set('requester', requester);
    url.searchParams.set('limit', String(limit));
    if (cursor !== null) {
      url.searchParams.set('cursor', cursor);
    }

    const response = await fetchWithTimeout(url.toString(), signal);
    if (!response.ok) {
      throw new MechAnalyticsError(
        `mech-analytics scored-rows failed: HTTP ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const body = (await response.json()) as ScoredRowsResponse;
    yield body.rows;

    cursor = body.next_cursor;
    if (cursor === null) {
      return;
    }
    pageCount += 1;
  }
}

export async function fetchAllScoredRows(params: FetchScoredRowsParams): Promise<ScoredRow[]> {
  const all: ScoredRow[] = [];
  for await (const page of iterateScoredRows(params)) {
    all.push(...page);
  }
  return all;
}

export async function fetchRequesterMetrics(
  chainId: number,
  requester: string,
  signal?: AbortSignal,
): Promise<RequesterMetricsResponse> {
  const url = `${getMechAnalyticsUrl()}/v1/metrics/requester/${chainId}/${requester}`;
  const response = await fetchWithTimeout(url, signal);
  if (!response.ok) {
    throw new MechAnalyticsError(
      `mech-analytics requester metrics failed: HTTP ${response.status} ${response.statusText}`,
      response.status,
    );
  }
  return (await response.json()) as RequesterMetricsResponse;
}

async function fetchWithTimeout(url: string, callerSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', onCallerAbort);
  }
}
