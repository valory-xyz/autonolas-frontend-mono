import {
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_REPLAY_BATCH_SIZE,
  FEEDBACK_SHEET_RANGE,
  FUNDING_REQUEST_PENDING_PREFIX,
  FUNDING_REQUEST_SHEET_RANGE,
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
  range: string;
  parse: (raw: string) => T | null;
  toRow: (record: T) => SheetCell[];
};

export const SURVEY_SOURCE: PendingSource<PendingFeedbackRecord> = {
  label: 'Onboarding survey',
  prefix: FEEDBACK_PENDING_PREFIX,
  range: FEEDBACK_SHEET_RANGE,
  parse: parsePendingFeedbackRecord,
  toRow: (record) => mapSubmissionToSheetRow(record.submission, record.submittedAt),
};

export const FUNDING_REQUEST_SOURCE: PendingSource<PendingFundingRequestRecord> = {
  label: 'Funding request',
  prefix: FUNDING_REQUEST_PENDING_PREFIX,
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
        await quarantinePendingRecord(source.prefix, pathname, read.raw);
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

/**
 * Lists and drains one source within `limit`. A list failure is contained here so the other
 * sources still drain.
 */
const replaySource = async <T>(
  source: PendingSource<T>,
  limit: number,
): Promise<{ counts: ReplayCounts; listed: number }> => {
  try {
    if (limit <= 0) {
      // The batch is spent; only find out whether this source is being left behind.
      const { pathnames } = await listPendingPaths(source.prefix, 1);
      return { counts: { ...emptyCounts(), backlog: pathnames.length > 0 }, listed: 0 };
    }

    const { pathnames, hasMore } = await listPendingPaths(source.prefix, limit);
    const counts = await drainPendingSource(source, pathnames);
    return { counts: { ...counts, backlog: hasMore }, listed: pathnames.length };
  } catch (error) {
    console.error(`${source.label}: could not list pending records:`, error);
    return { counts: { ...emptyCounts(), failed: 1 }, listed: 0 };
  }
};

/**
 * Drains every source, surveys first, sharing one `FEEDBACK_REPLAY_BATCH_SIZE` so a run stays
 * within the time the batch was sized for.
 */
export const replayAllPending = async (): Promise<ReplayPendingResponse> => {
  const survey = await replaySource(SURVEY_SOURCE, FEEDBACK_REPLAY_BATCH_SIZE);
  const fundingRequests = await replaySource(
    FUNDING_REQUEST_SOURCE,
    FEEDBACK_REPLAY_BATCH_SIZE - survey.listed,
  );

  return {
    ok: !hasReplayFailures([survey.counts, fundingRequests.counts]),
    ...survey.counts,
    fundingRequests: fundingRequests.counts,
  };
};
