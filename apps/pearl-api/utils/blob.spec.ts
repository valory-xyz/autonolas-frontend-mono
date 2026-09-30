/**
 * These helpers only ever run in a Next.js API route, where `Response` and `ReadableStream` are
 * globals. The default jsdom environment has neither, so pin this suite to node.
 *
 * @jest-environment node
 */
import { del, get, list, put } from '@vercel/blob';

import {
  FEEDBACK_PENDING_PREFIX,
  FEEDBACK_UNREADABLE_PREFIX,
  FUNDING_REQUEST_PENDING_PREFIX,
} from '../constants';
import type { PendingFeedbackRecord } from '../types/feedback';
import type { PendingFundingRequestRecord } from '../types/fundingRequest';
import {
  getPendingRecord,
  listPendingPaths,
  putPendingFeedback,
  putPendingFundingRequest,
  quarantinePendingRecord,
} from './blob';
import { parsePendingFeedbackRecord } from './feedback';
import { parsePendingFundingRequestRecord } from './fundingRequest';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
}));

// The feedback buffer lives in its own private store, so every call must carry that store's
// token. Stub the config so the helpers resolve one without a real environment variable.
const FEEDBACK_TOKEN = 'feedback-store-token';
jest.mock('../constants/feedback', () => ({
  ...jest.requireActual('../constants/feedback'),
  FEEDBACK_BLOB_CONFIG: { READ_WRITE_TOKEN: 'feedback-store-token' },
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPut = put as jest.MockedFunction<typeof put>;
const mockDel = del as jest.MockedFunction<typeof del>;
const mockList = list as jest.MockedFunction<typeof list>;

const VALID_UUID = '9f1c2b7e-5a3d-4f2e-8c11-6b0d7a4e93f5';
const PATHNAME = `${FEEDBACK_PENDING_PREFIX}/${VALID_UUID}.json`;

const record: PendingFeedbackRecord = {
  submittedAt: '2026-09-07T10:00:00.000Z',
  submission: {
    submissionId: VALID_UUID,
    frictionAreas: ['backup_wallet'],
    rating: 2,
    comment: 'Took a while.',
    os: { type: 'Darwin', platform: 'darwin', arch: 'arm64', release: '24.3.0' },
    agentType: 'polymarket_trader',
    pearlVersion: '0.9.4',
    timeToFirstSuccessSeconds: 93600,
    timeToCompleteSurveySeconds: 42,
  },
};

/** `get` hands back a 200 with a readable stream; only the bytes matter to the code under test. */
const streamOf = (body: string) => ({ statusCode: 200, stream: new Response(body).body });

const mockStoredBody = (body: string) => {
  mockGet.mockResolvedValue(streamOf(body) as unknown as Awaited<ReturnType<typeof get>>);
};

beforeEach(() => {
  jest.clearAllMocks();
});

const getPendingFeedback = (pathname: string) =>
  getPendingRecord(pathname, parsePendingFeedbackRecord);

describe('getPendingRecord', () => {
  it('returns the record when the blob holds a valid submission', async () => {
    mockStoredBody(JSON.stringify(record));

    await expect(getPendingFeedback(PATHNAME)).resolves.toEqual({ status: 'ok', record });
  });

  it('reports missing when the blob is gone between the list and the read', async () => {
    mockGet.mockResolvedValue(null);

    await expect(getPendingFeedback(PATHNAME)).resolves.toEqual({ status: 'missing' });
  });

  it('warns with the status when the read is not a 200', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockGet.mockResolvedValue({ statusCode: 304, stream: null } as unknown as Awaited<
      ReturnType<typeof get>
    >);

    await expect(getPendingFeedback(PATHNAME)).resolves.toEqual({ status: 'missing' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('status 304'));
    warn.mockRestore();
  });

  it.each([
    ['truncated json', '{"submittedAt":"2026-09-07T10:00:00.000Z","submis'],
    ['a json array', '[]'],
    ['no submittedAt', JSON.stringify({ submission: record.submission })],
    [
      'a submission that fails validation',
      JSON.stringify({
        submittedAt: record.submittedAt,
        submission: { ...record.submission, rating: 9 },
      }),
    ],
  ])('reports unreadable with the raw bytes for %s', async (_case, body) => {
    mockStoredBody(body);

    await expect(getPendingFeedback(PATHNAME)).resolves.toEqual({
      status: 'unreadable',
      raw: body,
    });
  });
});

describe('quarantinePendingRecord', () => {
  it('copies the bytes under the unreadable prefix before deleting the original', async () => {
    const raw = '{"broken":true}';

    await quarantinePendingRecord(FEEDBACK_PENDING_PREFIX, PATHNAME, raw);

    expect(mockPut).toHaveBeenCalledWith(
      `${FEEDBACK_UNREADABLE_PREFIX}/${VALID_UUID}.json`,
      raw,
      expect.objectContaining({ access: 'private', addRandomSuffix: false, token: FEEDBACK_TOKEN }),
    );
    expect(mockDel).toHaveBeenCalledWith(PATHNAME, { token: FEEDBACK_TOKEN });
    expect(mockPut.mock.invocationCallOrder[0]).toBeLessThan(mockDel.mock.invocationCallOrder[0]);
  });

  it('refuses a pathname outside the given prefix, touching nothing', async () => {
    await expect(
      quarantinePendingRecord(FUNDING_REQUEST_PENDING_PREFIX, PATHNAME, 'x'),
    ).rejects.toThrow(`${PATHNAME} is not under ${FUNDING_REQUEST_PENDING_PREFIX}/`);

    expect(mockPut).not.toHaveBeenCalled();
    expect(mockDel).not.toHaveBeenCalled();
  });
});

describe('feedback store token', () => {
  it('reads with the feedback store token, never the default achievements credentials', async () => {
    mockStoredBody(JSON.stringify(record));

    await getPendingFeedback(PATHNAME);

    expect(mockGet).toHaveBeenCalledWith(PATHNAME, { access: 'private', token: FEEDBACK_TOKEN });
  });
});

const fundingRecord: PendingFundingRequestRecord = {
  submittedAt: '2026-09-28T10:00:00.000Z',
  submission: {
    submissionId: VALID_UUID,
    kind: 'token',
    requestedName: 'USDT',
    contextChain: 'base',
  },
};
const FUNDING_PATHNAME = `${FUNDING_REQUEST_PENDING_PREFIX}/${VALID_UUID}.json`;

describe('pending prefixes', () => {
  it('buffers each kind of record under its own prefix, never overwriting', async () => {
    await putPendingFeedback(record);
    await putPendingFundingRequest(fundingRecord);

    expect(mockPut).toHaveBeenNthCalledWith(
      1,
      PATHNAME,
      JSON.stringify(record),
      expect.objectContaining({ access: 'private', token: FEEDBACK_TOKEN }),
    );
    expect(mockPut).toHaveBeenNthCalledWith(
      2,
      FUNDING_PATHNAME,
      JSON.stringify(fundingRecord),
      expect.objectContaining({ access: 'private', token: FEEDBACK_TOKEN }),
    );
    for (const [, , options] of mockPut.mock.calls) {
      expect(options).not.toHaveProperty('allowOverwrite');
    }
  });

  it('lists only the requested prefix and reports whether more are pending', async () => {
    mockList.mockResolvedValue({
      blobs: [{ pathname: FUNDING_PATHNAME }],
      hasMore: true,
    } as unknown as Awaited<ReturnType<typeof list>>);

    await expect(listPendingPaths(FUNDING_REQUEST_PENDING_PREFIX)).resolves.toEqual({
      pathnames: [FUNDING_PATHNAME],
      hasMore: true,
    });
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: `${FUNDING_REQUEST_PENDING_PREFIX}/`,
        token: FEEDBACK_TOKEN,
      }),
    );
  });

  it('lists at most the given number of paths', async () => {
    mockList.mockResolvedValue({ blobs: [], hasMore: false } as unknown as Awaited<
      ReturnType<typeof list>
    >);

    await listPendingPaths(FUNDING_REQUEST_PENDING_PREFIX, 7);

    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ limit: 7 }));
  });

  it('reads a funding request back through its own parser', async () => {
    mockStoredBody(JSON.stringify(fundingRecord));

    await expect(
      getPendingRecord(FUNDING_PATHNAME, parsePendingFundingRequestRecord),
    ).resolves.toEqual({ status: 'ok', record: fundingRecord });
  });

  it('quarantines a funding request into the shared unreadable prefix', async () => {
    await quarantinePendingRecord(FUNDING_REQUEST_PENDING_PREFIX, FUNDING_PATHNAME, 'x');

    expect(mockPut).toHaveBeenCalledWith(
      `${FEEDBACK_UNREADABLE_PREFIX}/${VALID_UUID}.json`,
      'x',
      expect.objectContaining({ token: FEEDBACK_TOKEN }),
    );
    expect(mockDel).toHaveBeenCalledWith(FUNDING_PATHNAME, { token: FEEDBACK_TOKEN });
  });
});
