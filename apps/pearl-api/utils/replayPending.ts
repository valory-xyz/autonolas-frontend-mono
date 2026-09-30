import {
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_REPLAY_BATCH_SIZE,
  FEEDBACK_SHEET_RANGE,
  FEEDBACK_UNREADABLE_PREFIX,
  FUNDING_REQUEST_PENDING_PREFIX,
  FUNDING_REQUEST_SHEET_RANGE,
  FUNDING_REQUEST_UNREADABLE_PREFIX,
} from '../constants';
import type {
  PendingFeedbackRecord,
  PendingFundingRequestRecord,
  ReplayCounts,
  ReplayPendingResponse,
  SheetCell,
} from '../types';
import {
  deletePendingRecord,
  getPendingRecord,
  listPendingPaths,
  quarantinePendingRecord,
} from './blob';
import { mapSubmissionToSheetRow, parsePendingFeedbackRecord } from './feedback';
import { mapFundingRequestToSheetRow, parsePendingFundingRequestRecord } from './fundingRequest';
import { appendSheetRow } from './googleSheets';

/** One kind of buffered record: where it waits, how to read it, and where its row goes. */
export type PendingSource<T> = {
  label: string;
  prefix: string;
  unreadablePrefix: string;
  range: string;
  parse: (raw: string) => T | null;
  toRow: (record: T) => SheetCell[];
};

export const SURVEY_SOURCE: PendingSource<PendingFeedbackRecord> = {
  label: 'Onboarding survey',
  prefix: FEEDBACK_PENDING_PREFIX,
  unreadablePrefix: FEEDBACK_UNREADABLE_PREFIX,
  range: FEEDBACK_SHEET_RANGE,
  parse: parsePendingFeedbackRecord,
  toRow: (record) => mapSubmissionToSheetRow(record.submission, record.submittedAt),
};

export const FUNDING_REQUEST_SOURCE: PendingSource<PendingFundingRequestRecord> = {
  label: 'Funding request',
  prefix: FUNDING_REQUEST_PENDING_PREFIX,
  unreadablePrefix: FUNDING_REQUEST_UNREADABLE_PREFIX,
  range: FUNDING_REQUEST_SHEET_RANGE,
  parse: parsePendingFundingRequestRecord,
  toRow: (record) => mapFundingRequestToSheetRow(record.submission, record.submittedAt),
};

const emptyCounts = (): ReplayCounts => ({
  replayed: 0,
  failed: 0,
  quarantined: 0,
  undeleted: 0,
  backlog: false,
});

/** Appends each pending record of one source to its sheet, deleting it only once appended. */
export const drainPendingSource = async <T>(
  source: PendingSource<T>,
  pathnames: string[],
): Promise<ReplayCounts> => {
  const counts = emptyCounts();

  for (const pathname of pathnames) {
    try {
      const read = await getPendingRecord(pathname, source.parse);

      // Vanished between the list and the read (a concurrent run took it).
      if (read.status === 'missing') continue;

      if (read.status === 'unreadable') {
        console.error(`${source.label}: quarantining unreadable pending blob ${pathname}`);
        await quarantinePendingRecord(source, pathname, read.raw);
        counts.quarantined += 1;
        continue;
      }

      await appendSheetRow(source.range, source.toRow(read.record));
      counts.replayed += 1;
    } catch (error) {
      // The blob stays for the next run.
      counts.failed += 1;
      console.error(`${source.label}: replay failed for ${pathname}:`, error);
      continue;
    }

    // Delete only after a successful append, and account for it separately: a failed delete is
    // an appended row that the next run will append again, not a failed replay.
    try {
      await deletePendingRecord(pathname);
    } catch (error) {
      counts.undeleted += 1;
      console.error(
        `${source.label}: appended ${pathname} but could not delete it; it will be replayed again:`,
        error,
      );
    }
  }

  return counts;
};

/** Whether any source left a record behind for the next run. */
export const hasReplayFailures = (counts: ReplayCounts[]): boolean =>
  counts.some((c) => c.failed > 0 || c.undeleted > 0 || c.backlog);

/** Splits `batch` evenly across sources, giving any share a source cannot use to the others. */
export const splitBatch = (pending: number[], batch: number): number[] => {
  const shares = pending.map(() => 0);
  let left = batch;
  let open = pending.flatMap((count, i) => (count > 0 ? [i] : []));

  while (left > 0 && open.length > 0) {
    const share = Math.max(1, Math.floor(left / open.length));
    for (const i of open) {
      const take = Math.min(share, pending[i] - shares[i], left);
      shares[i] += take;
      left -= take;
    }
    open = open.filter((i) => shares[i] < pending[i]);
  }

  return shares;
};

type Listing = { pathnames: string[]; hasMore: boolean };

/** `null` when the list fails, so the other sources still drain. */
const listSource = async <T>(source: PendingSource<T>): Promise<Listing | null> => {
  try {
    return await listPendingPaths(source.prefix, FEEDBACK_REPLAY_BATCH_SIZE);
  } catch (error) {
    console.error(`${source.label}: could not list pending records:`, error);
    return null;
  }
};

const replayListing = async <T>(
  source: PendingSource<T>,
  listing: Listing | null,
  share: number,
): Promise<ReplayCounts> => {
  if (!listing) return { ...emptyCounts(), failed: 1 };

  const counts = await drainPendingSource(source, listing.pathnames.slice(0, share));
  return { ...counts, backlog: listing.hasMore || listing.pathnames.length > share };
};

/** Drains every source within one `FEEDBACK_REPLAY_BATCH_SIZE`, split by `splitBatch`. */
export const replayAllPending = async (): Promise<ReplayPendingResponse> => {
  const [surveys, fundingRequests] = await Promise.all([
    listSource(SURVEY_SOURCE),
    listSource(FUNDING_REQUEST_SOURCE),
  ]);
  const [surveyShare, fundingShare] = splitBatch(
    [surveys?.pathnames.length ?? 0, fundingRequests?.pathnames.length ?? 0],
    FEEDBACK_REPLAY_BATCH_SIZE,
  );

  const surveyCounts = await replayListing(SURVEY_SOURCE, surveys, surveyShare);
  const fundingCounts = await replayListing(FUNDING_REQUEST_SOURCE, fundingRequests, fundingShare);

  return {
    ok: !hasReplayFailures([surveyCounts, fundingCounts]),
    ...surveyCounts,
    fundingRequests: fundingCounts,
  };
};
