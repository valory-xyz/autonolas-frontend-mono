/**
 * These helpers only ever run in a Next.js API route, where `Response` and `ReadableStream` are
 * globals. The default jsdom environment has neither, so pin this suite to node.
 *
 * @jest-environment node
 */
import { del, get, put } from '@vercel/blob';

import { FEEDBACK_PENDING_PREFIX, FEEDBACK_UNREADABLE_PREFIX } from '../constants';
import type { PendingFeedbackRecord } from '../types/feedback';
import { getPendingFeedback, quarantinePendingFeedback } from './blob';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPut = put as jest.MockedFunction<typeof put>;
const mockDel = del as jest.MockedFunction<typeof del>;

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

/** `get` hands back a readable stream; only the bytes matter to the code under test. */
const streamOf = (body: string) => ({ stream: new Response(body).body });

const mockStoredBody = (body: string) => {
  mockGet.mockResolvedValue(streamOf(body) as unknown as Awaited<ReturnType<typeof get>>);
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getPendingFeedback', () => {
  it('returns the record when the blob holds a valid submission', async () => {
    mockStoredBody(JSON.stringify(record));

    await expect(getPendingFeedback(PATHNAME)).resolves.toEqual({ status: 'ok', record });
  });

  it('reports missing when the blob is gone between the list and the read', async () => {
    mockGet.mockResolvedValue(null);

    await expect(getPendingFeedback(PATHNAME)).resolves.toEqual({ status: 'missing' });
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

describe('quarantinePendingFeedback', () => {
  it('copies the bytes under the unreadable prefix before deleting the original', async () => {
    const raw = '{"broken":true}';

    await quarantinePendingFeedback(PATHNAME, raw);

    expect(mockPut).toHaveBeenCalledWith(
      `${FEEDBACK_UNREADABLE_PREFIX}/${VALID_UUID}.json`,
      raw,
      expect.objectContaining({ access: 'private', addRandomSuffix: false }),
    );
    expect(mockDel).toHaveBeenCalledWith(PATHNAME);
    expect(mockPut.mock.invocationCallOrder[0]).toBeLessThan(mockDel.mock.invocationCallOrder[0]);
  });
});
