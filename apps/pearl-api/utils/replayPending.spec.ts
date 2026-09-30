/**
 * @jest-environment node
 */
import {
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_REPLAY_BATCH_SIZE,
  FEEDBACK_SHEET_COLUMNS,
  FEEDBACK_SHEET_RANGE,
  FEEDBACK_UNREADABLE_PREFIX,
  FUNDING_REQUEST_PENDING_PREFIX,
  FUNDING_REQUEST_SHEET_COLUMNS,
  FUNDING_REQUEST_SHEET_RANGE,
  FUNDING_REQUEST_UNREADABLE_PREFIX,
} from '../constants';
import type { PendingFeedbackRecord, PendingFundingRequestRecord, ReplayCounts } from '../types';
import {
  deletePendingRecord,
  getPendingRecord,
  listPendingPaths,
  quarantinePendingRecord,
} from './blob';
import { appendSheetRow } from './googleSheets';
import {
  FUNDING_REQUEST_SOURCE,
  PendingSource,
  SURVEY_SOURCE,
  drainPendingSource,
  hasReplayFailures,
  replayAllPending,
  splitBatch,
} from './replayPending';

jest.mock('./blob', () => ({
  getPendingRecord: jest.fn(),
  deletePendingRecord: jest.fn(),
  listPendingPaths: jest.fn(),
  quarantinePendingRecord: jest.fn(),
}));

jest.mock('./googleSheets', () => ({
  appendSheetRow: jest.fn(),
}));

const mockGetPendingRecord = getPendingRecord as jest.MockedFunction<typeof getPendingRecord>;
const mockDeletePendingRecord = deletePendingRecord as jest.MockedFunction<
  typeof deletePendingRecord
>;
const mockQuarantinePendingRecord = quarantinePendingRecord as jest.MockedFunction<
  typeof quarantinePendingRecord
>;
const mockAppendSheetRow = appendSheetRow as jest.MockedFunction<typeof appendSheetRow>;
const mockListPendingPaths = listPendingPaths as jest.MockedFunction<typeof listPendingPaths>;

const PREFIX = 'test/pending';
const PATHNAME = `${PREFIX}/a.json`;

const source: PendingSource<string> = {
  label: 'Test source',
  prefix: PREFIX,
  unreadablePrefix: 'test/unreadable',
  range: 'Tab!A:B',
  parse: (raw) => raw,
  toRow: (record) => [record],
};

const noCounts: ReplayCounts = {
  replayed: 0,
  failed: 0,
  quarantined: 0,
  undeleted: 0,
  backlog: false,
};

describe('drainPendingSource', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('appends a readable record to its range and then deletes it', async () => {
    mockGetPendingRecord.mockResolvedValue({ status: 'ok', record: 'row' });

    const counts = await drainPendingSource(source, [PATHNAME]);

    expect(counts).toEqual({ ...noCounts, replayed: 1 });
    expect(mockAppendSheetRow).toHaveBeenCalledWith('Tab!A:B', ['row']);
    expect(mockDeletePendingRecord).toHaveBeenCalledWith(PATHNAME);
  });

  it('skips a record that vanished between the list and the read', async () => {
    mockGetPendingRecord.mockResolvedValue({ status: 'missing' });

    const counts = await drainPendingSource(source, [PATHNAME]);

    expect(counts).toEqual(noCounts);
    expect(mockAppendSheetRow).not.toHaveBeenCalled();
    expect(mockDeletePendingRecord).not.toHaveBeenCalled();
  });

  it('quarantines an unreadable record under its source prefix without appending it', async () => {
    mockGetPendingRecord.mockResolvedValue({ status: 'unreadable', raw: 'garbage' });

    const counts = await drainPendingSource(source, [PATHNAME]);

    expect(counts).toEqual({ ...noCounts, quarantined: 1 });
    expect(mockQuarantinePendingRecord).toHaveBeenCalledWith(source, PATHNAME, 'garbage');
    expect(mockAppendSheetRow).not.toHaveBeenCalled();
    expect(mockDeletePendingRecord).not.toHaveBeenCalled();
  });

  it('keeps the blob and counts a failure when the append fails', async () => {
    mockGetPendingRecord.mockResolvedValue({ status: 'ok', record: 'row' });
    mockAppendSheetRow.mockRejectedValue(new Error('sheets down'));

    const counts = await drainPendingSource(source, [PATHNAME]);

    expect(counts).toEqual({ ...noCounts, failed: 1 });
    expect(mockDeletePendingRecord).not.toHaveBeenCalled();
  });

  it('counts an appended record whose delete failed as undeleted, not failed', async () => {
    mockGetPendingRecord.mockResolvedValue({ status: 'ok', record: 'row' });
    mockDeletePendingRecord.mockRejectedValue(new Error('blob down'));

    const counts = await drainPendingSource(source, [PATHNAME]);

    expect(counts).toEqual({ ...noCounts, replayed: 1, undeleted: 1 });
  });

  it('carries on with the next record after one fails', async () => {
    mockGetPendingRecord
      .mockRejectedValueOnce(new Error('read failed'))
      .mockResolvedValueOnce({ status: 'ok', record: 'row' });

    const counts = await drainPendingSource(source, [PATHNAME, `${PREFIX}/b.json`]);

    expect(counts).toEqual({ ...noCounts, replayed: 1, failed: 1 });
  });
});

describe('hasReplayFailures', () => {
  it('is false when every source drained cleanly', () => {
    expect(hasReplayFailures([{ ...noCounts, replayed: 2, quarantined: 1 }, noCounts])).toBe(false);
  });

  it('is true when only the second source failed an append', () => {
    expect(hasReplayFailures([noCounts, { ...noCounts, failed: 1 }])).toBe(true);
  });

  it('is true when a source left an appended record undeleted', () => {
    expect(hasReplayFailures([{ ...noCounts, replayed: 1, undeleted: 1 }, noCounts])).toBe(true);
  });

  it('is true when a source left records beyond the batch', () => {
    expect(hasReplayFailures([noCounts, { ...noCounts, backlog: true }])).toBe(true);
  });
});

describe('splitBatch', () => {
  it.each([
    { pending: [60, 60], batch: 50, shares: [25, 25] },
    { pending: [50, 10], batch: 50, shares: [40, 10] },
    { pending: [3, 50], batch: 50, shares: [3, 47] },
    { pending: [0, 0], batch: 50, shares: [0, 0] },
    { pending: [60, 60], batch: 51, shares: [26, 25] },
    { pending: [1, 1], batch: 1, shares: [1, 0] },
  ])('gives $pending a batch of $batch as $shares', ({ pending, batch, shares }) => {
    expect(splitBatch(pending, batch)).toEqual(shares);
  });
});

describe('real sources', () => {
  it('read from and quarantine into their own prefixes', () => {
    expect(SURVEY_SOURCE.prefix).toBe('feedback/pending');
    expect(SURVEY_SOURCE.unreadablePrefix).toBe(FEEDBACK_UNREADABLE_PREFIX);
    expect(FUNDING_REQUEST_SOURCE.prefix).toBe('feedback/pending-funding-requests');
    expect(FUNDING_REQUEST_SOURCE.unreadablePrefix).toBe(FUNDING_REQUEST_UNREADABLE_PREFIX);
  });

  const SUBMISSION_ID = '9f1c2b7e-5a3d-4f2e-8c11-6b0d7a4e93f5';
  const SUBMITTED_AT = '2026-09-28T10:00:00.000Z';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  /** The appended row keyed by its sheet's column names. */
  const appendedRow = (columns: readonly string[]) => {
    const [, row] = mockAppendSheetRow.mock.calls[0];
    return Object.fromEntries(columns.map((column, i) => [column, row[i]]));
  };

  it('appends a buffered funding request to the FundingRequests tab in its column order', async () => {
    const record: PendingFundingRequestRecord = {
      submittedAt: SUBMITTED_AT,
      submission: {
        submissionId: SUBMISSION_ID,
        kind: 'token',
        requestedName: 'USDT',
        contextChain: 'base',
      },
    };
    mockGetPendingRecord.mockResolvedValue({ status: 'ok', record });

    await drainPendingSource(FUNDING_REQUEST_SOURCE, [`${FUNDING_REQUEST_PENDING_PREFIX}/a.json`]);

    expect(mockAppendSheetRow.mock.calls[0][0]).toBe(FUNDING_REQUEST_SHEET_RANGE);
    expect(appendedRow(FUNDING_REQUEST_SHEET_COLUMNS)).toEqual({
      request_id: SUBMISSION_ID,
      submitted_at: '2026-09-28T10:00:00Z',
      kind: 'token',
      requested_name: 'USDT',
      context_chain: 'base',
    });
  });

  it('quarantines an unreadable funding request under the funding prefix', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const pathname = `${FUNDING_REQUEST_PENDING_PREFIX}/a.json`;
    mockGetPendingRecord.mockResolvedValue({ status: 'unreadable', raw: 'garbage' });

    await drainPendingSource(FUNDING_REQUEST_SOURCE, [pathname]);

    expect(mockQuarantinePendingRecord).toHaveBeenCalledWith(
      FUNDING_REQUEST_SOURCE,
      pathname,
      'garbage',
    );
  });

  it('appends a buffered survey to the Responses tab in its column order', async () => {
    const record: PendingFeedbackRecord = {
      submittedAt: SUBMITTED_AT,
      submission: {
        submissionId: SUBMISSION_ID,
        frictionAreas: [],
        rating: 3,
        comment: 'Smooth.',
        os: { type: 'Darwin', platform: 'darwin', arch: 'arm64', release: '24.3.0' },
        agentType: 'polymarket_trader',
        pearlVersion: '0.9.4',
        timeToFirstSuccessSeconds: null,
        timeToCompleteSurveySeconds: 42,
      },
    };
    mockGetPendingRecord.mockResolvedValue({ status: 'ok', record });

    await drainPendingSource(SURVEY_SOURCE, [`${FEEDBACK_PENDING_PREFIX}/a.json`]);

    expect(mockAppendSheetRow.mock.calls[0][0]).toBe(FEEDBACK_SHEET_RANGE);
    expect(appendedRow(FEEDBACK_SHEET_COLUMNS)).toMatchObject({
      response_id: SUBMISSION_ID,
      'rating (1-3)': 3,
      open_text: 'Smooth.',
    });
  });
});

describe('replayAllPending', () => {
  const surveyPath = (i: number) => `${FEEDBACK_PENDING_PREFIX}/${i}.json`;
  const fundingPath = (i: number) => `${FUNDING_REQUEST_PENDING_PREFIX}/${i}.json`;
  const page = (pathnames: string[], hasMore = false) => ({ pathnames, hasMore });

  /** Routes each list call to its prefix's page, so the test does not depend on call order. */
  const mockPages = (pages: Record<string, ReturnType<typeof page> | Error>) => {
    mockListPendingPaths.mockImplementation(async (prefix) => {
      const result = pages[prefix];
      if (result instanceof Error) throw result;
      return result ?? page([]);
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetPendingRecord.mockImplementation(async (pathname) => ({
      status: 'ok',
      record: pathname,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('drains each source into its own tab and reports surveys flat, funding requests nested', async () => {
    mockPages({
      [FEEDBACK_PENDING_PREFIX]: page([surveyPath(0)]),
      [FUNDING_REQUEST_PENDING_PREFIX]: page([fundingPath(0), fundingPath(1)]),
    });
    jest.spyOn(SURVEY_SOURCE, 'toRow').mockReturnValue(['survey']);
    jest.spyOn(FUNDING_REQUEST_SOURCE, 'toRow').mockReturnValue(['funding']);

    const result = await replayAllPending();

    expect(result).toEqual({
      ok: true,
      ...noCounts,
      replayed: 1,
      fundingRequests: { ...noCounts, replayed: 2 },
    });
    expect(mockAppendSheetRow.mock.calls).toEqual([
      [FEEDBACK_SHEET_RANGE, ['survey']],
      [FUNDING_REQUEST_SHEET_RANGE, ['funding']],
      [FUNDING_REQUEST_SHEET_RANGE, ['funding']],
    ]);
    expect(mockDeletePendingRecord.mock.calls).toEqual([
      [surveyPath(0)],
      [fundingPath(0)],
      [fundingPath(1)],
    ]);
  });

  const fullPage = (path: (i: number) => string) =>
    page(
      Array.from({ length: FEEDBACK_REPLAY_BATCH_SIZE }, (_, i) => path(i)),
      true,
    );

  it('lists every source up to the full batch', async () => {
    mockPages({});

    await replayAllPending();

    expect(mockListPendingPaths).toHaveBeenCalledWith(
      FEEDBACK_PENDING_PREFIX,
      FEEDBACK_REPLAY_BATCH_SIZE,
    );
    expect(mockListPendingPaths).toHaveBeenCalledWith(
      FUNDING_REQUEST_PENDING_PREFIX,
      FEEDBACK_REPLAY_BATCH_SIZE,
    );
  });

  it('splits the batch evenly when both sources have more than their share', async () => {
    mockPages({
      [FEEDBACK_PENDING_PREFIX]: fullPage(surveyPath),
      [FUNDING_REQUEST_PENDING_PREFIX]: fullPage(fundingPath),
    });
    jest.spyOn(SURVEY_SOURCE, 'toRow').mockReturnValue(['survey']);
    jest.spyOn(FUNDING_REQUEST_SOURCE, 'toRow').mockReturnValue(['funding']);

    const result = await replayAllPending();

    const half = FEEDBACK_REPLAY_BATCH_SIZE / 2;
    expect(result).toMatchObject({
      ok: false,
      replayed: half,
      backlog: true,
      fundingRequests: { replayed: half, backlog: true },
    });
    expect(mockAppendSheetRow).toHaveBeenCalledTimes(FEEDBACK_REPLAY_BATCH_SIZE);
  });

  it('still replays funding requests while a full batch of surveys keeps failing', async () => {
    mockPages({
      [FEEDBACK_PENDING_PREFIX]: fullPage(surveyPath),
      [FUNDING_REQUEST_PENDING_PREFIX]: page([fundingPath(0)]),
    });
    jest.spyOn(SURVEY_SOURCE, 'toRow').mockReturnValue(['survey']);
    jest.spyOn(FUNDING_REQUEST_SOURCE, 'toRow').mockReturnValue(['funding']);
    mockAppendSheetRow.mockImplementation(async (range) => {
      if (range === FEEDBACK_SHEET_RANGE) throw new Error('Responses tab renamed');
    });

    const result = await replayAllPending();

    expect(result).toMatchObject({
      ok: false,
      failed: FEEDBACK_REPLAY_BATCH_SIZE - 1,
      backlog: true,
      fundingRequests: { ...noCounts, replayed: 1 },
    });
    expect(mockDeletePendingRecord.mock.calls).toEqual([[fundingPath(0)]]);
  });

  it('stays green when surveys use up the batch and no funding request is pending', async () => {
    const surveys = Array.from({ length: FEEDBACK_REPLAY_BATCH_SIZE }, (_, i) => surveyPath(i));
    mockPages({ [FEEDBACK_PENDING_PREFIX]: page(surveys) });
    jest.spyOn(SURVEY_SOURCE, 'toRow').mockReturnValue(['survey']);

    const result = await replayAllPending();

    expect(result.ok).toBe(true);
    expect(result.fundingRequests).toEqual(noCounts);
  });

  it('fails the run when a source has more pending than it listed', async () => {
    mockPages({ [FEEDBACK_PENDING_PREFIX]: page([surveyPath(0)], true) });
    jest.spyOn(SURVEY_SOURCE, 'toRow').mockReturnValue(['survey']);

    const result = await replayAllPending();

    expect(result).toMatchObject({ ok: false, replayed: 1, backlog: true });
  });

  it('still drains surveys when the funding list fails, and fails the run', async () => {
    mockPages({
      [FEEDBACK_PENDING_PREFIX]: page([surveyPath(0)]),
      [FUNDING_REQUEST_PENDING_PREFIX]: new Error('blob down'),
    });
    jest.spyOn(SURVEY_SOURCE, 'toRow').mockReturnValue(['survey']);

    const result = await replayAllPending();

    expect(result).toEqual({
      ok: false,
      ...noCounts,
      replayed: 1,
      fundingRequests: { ...noCounts, failed: 1 },
    });
    expect(console.error).toHaveBeenCalledWith(
      'Funding request: could not list pending records:',
      expect.any(Error),
    );
  });

  it('still drains funding requests when the survey list fails', async () => {
    mockPages({
      [FEEDBACK_PENDING_PREFIX]: new Error('blob down'),
      [FUNDING_REQUEST_PENDING_PREFIX]: page([fundingPath(0)]),
    });
    jest.spyOn(FUNDING_REQUEST_SOURCE, 'toRow').mockReturnValue(['funding']);

    const result = await replayAllPending();

    expect(result).toMatchObject({ ok: false, failed: 1, fundingRequests: { replayed: 1 } });
    expect(mockListPendingPaths).toHaveBeenCalledWith(
      FUNDING_REQUEST_PENDING_PREFIX,
      FEEDBACK_REPLAY_BATCH_SIZE,
    );
  });
});
