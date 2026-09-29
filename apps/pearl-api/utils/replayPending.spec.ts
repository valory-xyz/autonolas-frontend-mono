/**
 * @jest-environment node
 */
import { FEEDBACK_REPLAY_BATCH_SIZE } from '../constants';
import type { ReplayCounts } from '../types';
import {
  deletePendingRecord,
  getPendingRecord,
  listPendingPaths,
  quarantinePendingRecord,
} from './blob';
import { appendSheetRow } from './googleSheets';
import {
  PendingSource,
  drainPendingSource,
  hasReplayFailures,
  listPendingPathsWithinBatch,
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
  range: 'Tab!A:B',
  parse: (raw) => raw,
  toRow: (record) => [record],
};

const noCounts: ReplayCounts = { replayed: 0, failed: 0, quarantined: 0, undeleted: 0 };

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
    expect(mockQuarantinePendingRecord).toHaveBeenCalledWith(PREFIX, PATHNAME, 'garbage');
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
});

describe('listPendingPathsWithinBatch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const paths = (prefix: string, count: number) =>
    Array.from({ length: count }, (_, i) => `${prefix}/${i}.json`);

  it('gives the next prefix only what the earlier ones left of the batch', async () => {
    mockListPendingPaths.mockResolvedValueOnce(paths('a', 30)).mockResolvedValueOnce(paths('b', 5));

    const result = await listPendingPathsWithinBatch(['a', 'b']);

    expect(mockListPendingPaths).toHaveBeenNthCalledWith(1, 'a', FEEDBACK_REPLAY_BATCH_SIZE);
    expect(mockListPendingPaths).toHaveBeenNthCalledWith(2, 'b', FEEDBACK_REPLAY_BATCH_SIZE - 30);
    expect(result).toEqual([paths('a', 30), paths('b', 5)]);
  });

  it('does not list a prefix once the batch is used up', async () => {
    mockListPendingPaths.mockResolvedValueOnce(paths('a', FEEDBACK_REPLAY_BATCH_SIZE));

    const result = await listPendingPathsWithinBatch(['a', 'b']);

    expect(mockListPendingPaths).toHaveBeenCalledTimes(1);
    expect(result).toEqual([paths('a', FEEDBACK_REPLAY_BATCH_SIZE), []]);
  });
});
