import { FEEDBACK_SHEET_COLUMNS } from '../constants';
import type { OnboardingSurveySubmission } from '../types/feedback';
import {
  isJsonContentType,
  mapSubmissionToSheetRow,
  parseOnboardingSurveySubmission,
  parsePendingFeedbackRecord,
} from './feedback';

const VALID_UUID = '9f1c2b7e-5a3d-4f2e-8c11-6b0d7a4e93f5';

const bodyBuilder = (overrides: Record<string, unknown> = {}) => ({
  submissionId: VALID_UUID,
  frictionAreas: ['backup_wallet', 'funding_agent'],
  rating: 2,
  comment: 'Took me a while to find the deposit address.',
  os: { type: 'Darwin', platform: 'darwin', arch: 'arm64', release: '24.3.0' },
  agentType: 'polymarket_trader',
  pearlVersion: '0.9.4',
  timeToFirstSuccessSeconds: 93600,
  timeToCompleteSurveySeconds: 42,
  ...overrides,
});

const submissionBuilder = (
  overrides: Partial<OnboardingSurveySubmission> = {},
): OnboardingSurveySubmission => ({
  submissionId: VALID_UUID,
  frictionAreas: ['backup_wallet', 'funding_agent'],
  rating: 2,
  comment: 'Took a while.',
  os: { type: 'Darwin', platform: 'darwin', arch: 'arm64', release: '24.3.0' },
  agentType: 'polymarket_trader',
  pearlVersion: '0.9.4',
  timeToFirstSuccessSeconds: 93600,
  timeToCompleteSurveySeconds: 42,
  ...overrides,
});

describe('parseOnboardingSurveySubmission', () => {
  it('accepts a complete submission', () => {
    expect(parseOnboardingSurveySubmission(bodyBuilder())).not.toBeNull();
  });

  it.each([
    'backup_wallet',
    'choosing_agent',
    'activity_rewards',
    'funding_agent',
    'agent_activity',
    'other',
  ])('accepts the friction area %s', (area) => {
    const result = parseOnboardingSurveySubmission(bodyBuilder({ frictionAreas: [area] }));
    expect(result?.frictionAreas).toEqual([area]);
  });

  it('accepts everything_smooth on its own', () => {
    const result = parseOnboardingSurveySubmission(
      bodyBuilder({ frictionAreas: ['everything_smooth'], rating: 3 }),
    );
    expect(result?.frictionAreas).toEqual(['everything_smooth']);
  });

  it('rejects everything_smooth combined with a friction area', () => {
    const body = bodyBuilder({ frictionAreas: ['everything_smooth', 'backup_wallet'] });
    expect(parseOnboardingSurveySubmission(body)).toBeNull();
  });

  it('accepts an empty friction list', () => {
    expect(
      parseOnboardingSurveySubmission(bodyBuilder({ frictionAreas: [] }))?.frictionAreas,
    ).toEqual([]);
  });

  it('rejects an unknown friction area', () => {
    expect(
      parseOnboardingSurveySubmission(bodyBuilder({ frictionAreas: ['gas_fees'] })),
    ).toBeNull();
  });

  it('rejects duplicate friction areas', () => {
    const body = bodyBuilder({ frictionAreas: ['backup_wallet', 'backup_wallet'] });
    expect(parseOnboardingSurveySubmission(body)).toBeNull();
  });

  it('rejects a non-array friction list', () => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ frictionAreas: 'other' }))).toBeNull();
  });

  it.each([1, 2, 3])('accepts the rating %i', (rating) => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ rating }))?.rating).toBe(rating);
  });

  it.each([0, 4, 2.5, '2', null])('rejects the rating %p', (rating) => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ rating }))).toBeNull();
  });

  it('accepts a well-formed uuid v4 submissionId', () => {
    expect(parseOnboardingSurveySubmission(bodyBuilder())?.submissionId).toBe(VALID_UUID);
  });

  it.each([
    ['missing', undefined],
    ['malformed', 'not-a-uuid'],
    // Version nibble 1 — a v1 UUID is well-formed but not what Pearl generates.
    ['a non-v4 uuid', '9f1c2b7e-5a3d-1f2e-8c11-6b0d7a4e93f5'],
  ])('rejects a %s submissionId', (_label, submissionId) => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ submissionId }))).toBeNull();
  });

  it.each([undefined, null])('treats a %p comment as empty', (comment) => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ comment }))?.comment).toBe('');
  });

  it('accepts a comment at the 2000-character cap', () => {
    const comment = 'a'.repeat(2000);
    expect(parseOnboardingSurveySubmission(bodyBuilder({ comment }))?.comment).toBe(comment);
  });

  it('rejects a comment over the 2000-character cap', () => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ comment: 'a'.repeat(2001) }))).toBeNull();
  });

  it('accepts a null timeToFirstSuccessSeconds', () => {
    const result = parseOnboardingSurveySubmission(
      bodyBuilder({ timeToFirstSuccessSeconds: null }),
    );
    expect(result?.timeToFirstSuccessSeconds).toBeNull();
  });

  it('keeps a zero timeToFirstSuccessSeconds distinct from null', () => {
    const result = parseOnboardingSurveySubmission(bodyBuilder({ timeToFirstSuccessSeconds: 0 }));
    expect(result?.timeToFirstSuccessSeconds).toBe(0);
  });

  it.each([-1, 1.5])('rejects the timeToFirstSuccessSeconds %p', (value) => {
    expect(
      parseOnboardingSurveySubmission(bodyBuilder({ timeToFirstSuccessSeconds: value })),
    ).toBeNull();
  });

  it.each([-1, 1.5, null])('rejects the timeToCompleteSurveySeconds %p', (value) => {
    expect(
      parseOnboardingSurveySubmission(bodyBuilder({ timeToCompleteSurveySeconds: value })),
    ).toBeNull();
  });

  it.each(['type', 'platform', 'arch', 'release'])('rejects an over-length os.%s', (field) => {
    const os = { ...bodyBuilder().os, [field]: 'a'.repeat(65) };
    expect(parseOnboardingSurveySubmission(bodyBuilder({ os }))).toBeNull();
  });

  it('rejects a missing os object', () => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ os: undefined }))).toBeNull();
  });

  it.each(['agentType', 'pearlVersion'])('rejects an over-length %s', (field) => {
    expect(parseOnboardingSurveySubmission(bodyBuilder({ [field]: 'a'.repeat(65) }))).toBeNull();
  });

  it.each([null, undefined, 'a string', []])('rejects the non-object body %p', (body) => {
    expect(parseOnboardingSurveySubmission(body)).toBeNull();
  });

  it('drops an unexpected property rather than carrying it through', () => {
    const result = parseOnboardingSurveySubmission(bodyBuilder({ walletAddress: '0xdeadbeef' }));
    expect(result).not.toBeNull();
    expect(Object.keys(result as object)).not.toContain('walletAddress');
  });
});

describe('mapSubmissionToSheetRow', () => {
  const submittedAt = '2026-09-07T12:00:00.000Z';

  it('produces one cell per declared column', () => {
    const row = mapSubmissionToSheetRow(submissionBuilder(), submittedAt);
    expect(row).toHaveLength(FEEDBACK_SHEET_COLUMNS.length);
    expect(row).toHaveLength(14);
  });

  it('writes the columns in the documented order', () => {
    const row = mapSubmissionToSheetRow(submissionBuilder(), submittedAt);
    expect(row).toEqual([
      submittedAt,
      VALID_UUID,
      'backup_wallet, funding_agent',
      false,
      2,
      'Took a while.',
      'Darwin',
      'darwin',
      'arm64',
      '24.3.0',
      'polymarket_trader',
      '0.9.4',
      93600,
      42,
    ]);
  });

  it('keeps numeric and boolean cells typed rather than stringified', () => {
    const row = mapSubmissionToSheetRow(submissionBuilder(), submittedAt);
    expect(typeof row[3]).toBe('boolean');
    expect(typeof row[4]).toBe('number');
    expect(typeof row[12]).toBe('number');
    expect(typeof row[13]).toBe('number');
  });

  it('derives the everything-smooth column rather than taking it from the client', () => {
    const row = mapSubmissionToSheetRow(
      submissionBuilder({ frictionAreas: ['everything_smooth'], rating: 3 }),
      submittedAt,
    );
    expect(row[3]).toBe(true);
  });

  it('writes unavailable for a null time to first success', () => {
    const row = mapSubmissionToSheetRow(
      submissionBuilder({ timeToFirstSuccessSeconds: null }),
      submittedAt,
    );
    expect(row[12]).toBe('unavailable');
  });

  it('writes 0 rather than unavailable for a zero time to first success', () => {
    const row = mapSubmissionToSheetRow(
      submissionBuilder({ timeToFirstSuccessSeconds: 0 }),
      submittedAt,
    );
    expect(row[12]).toBe(0);
  });

  it('reuses the original timestamp on replay rather than the replay time', () => {
    const originalSubmittedAt = '2026-09-01T08:30:00.000Z';
    const row = mapSubmissionToSheetRow(submissionBuilder(), originalSubmittedAt);
    expect(row[0]).toBe(originalSubmittedAt);
  });

  it('never emits a value that was not validated onto the row', () => {
    const parsed = parseOnboardingSurveySubmission(
      bodyBuilder({ walletAddress: '0xdeadbeef', frictionAreas: ['other'] }),
    );
    const row = mapSubmissionToSheetRow(parsed as OnboardingSurveySubmission, submittedAt);
    expect(row.join('|')).not.toContain('0xdeadbeef');
  });
});

describe('parsePendingFeedbackRecord', () => {
  const submittedAt = '2026-09-07T12:00:00.000Z';

  it('round-trips a record written by the submit route', () => {
    const record = { submittedAt, submission: submissionBuilder() };
    expect(parsePendingFeedbackRecord(JSON.stringify(record))).toEqual(record);
  });

  it.each([
    ['not json', '{not json'],
    ['a non-object', '"just a string"'],
    ['a missing submittedAt', JSON.stringify({ submission: submissionBuilder() })],
    [
      'a non-date submittedAt',
      JSON.stringify({ submittedAt: 'yesterday', submission: submissionBuilder() }),
    ],
    ['a missing submission', JSON.stringify({ submittedAt })],
    [
      'an invalid submission',
      JSON.stringify({ submittedAt, submission: submissionBuilder({ rating: 9 as never }) }),
    ],
  ])('returns null for %s', (_label, body) => {
    expect(parsePendingFeedbackRecord(body)).toBeNull();
  });

  it('re-validates the submission so an injected property does not survive the replay', () => {
    const body = JSON.stringify({
      submittedAt,
      submission: { ...submissionBuilder(), walletAddress: '0xdeadbeef' },
    });
    const record = parsePendingFeedbackRecord(body);
    expect(record).not.toBeNull();
    expect(Object.keys(record?.submission ?? {})).not.toContain('walletAddress');
  });
});

describe('isJsonContentType', () => {
  it.each([
    'application/json',
    'application/json; charset=utf-8',
    'Application/JSON'.toLowerCase(),
  ])('accepts %s', (contentType) => {
    expect(isJsonContentType(contentType)).toBe(true);
  });

  it.each([undefined, '', 'text/plain', 'application/x-www-form-urlencoded', ['application/json']])(
    'rejects %p',
    (contentType) => {
      expect(isJsonContentType(contentType)).toBe(false);
    },
  );
});
