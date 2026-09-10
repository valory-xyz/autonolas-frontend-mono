import { EVERYTHING_SMOOTH, FEEDBACK_SHEET_COLUMNS, VALID_FRICTION_AREAS } from '../constants';
import type { FrictionArea, OnboardingSurveySubmission } from '../types/feedback';
import {
  isJsonContentType,
  mapSubmissionToSheetRow,
  parseOnboardingSurveySubmission,
  parsePendingFeedbackRecord,
} from './feedback';

const VALID_UUID = '9f1c2b7e-5a3d-4f2e-8c11-6b0d7a4e93f5';

const DEFAULT_SUBMISSION: OnboardingSurveySubmission = {
  submissionId: VALID_UUID,
  frictionAreas: ['backup_wallet', 'funding_agent'],
  rating: 2,
  comment: 'Took a while.',
  os: { type: 'Darwin', platform: 'darwin', arch: 'arm64', release: '24.3.0' },
  agentType: 'polymarket_trader',
  pearlVersion: '0.9.4',
  timeToFirstSuccessSeconds: 93600,
  timeToCompleteSurveySeconds: 42,
};

/** A request body; loosely typed so the intentionally invalid cases can be expressed. */
const bodyBuilder = (overrides: Record<string, unknown> = {}) => ({
  ...DEFAULT_SUBMISSION,
  ...overrides,
});

const submissionBuilder = (
  overrides: Partial<OnboardingSurveySubmission> = {},
): OnboardingSurveySubmission => ({ ...DEFAULT_SUBMISSION, ...overrides });

/** Every friction option except the fast exit, derived so a new one is covered automatically. */
const FRICTION_AREAS = VALID_FRICTION_AREAS.filter((area) => area !== EVERYTHING_SMOOTH);

describe('parseOnboardingSurveySubmission', () => {
  it('accepts a complete submission', () => {
    expect(parseOnboardingSurveySubmission(bodyBuilder())).not.toBeNull();
  });

  it.each(FRICTION_AREAS)('accepts the friction area %s', (area) => {
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

  /** The row keyed by header name, so each expectation labels itself. */
  const namedRow = (submission = submissionBuilder(), at = submittedAt) => {
    const row = mapSubmissionToSheetRow(submission, at);
    return Object.fromEntries(FEEDBACK_SHEET_COLUMNS.map((name, i) => [name, row[i]]));
  };

  /**
   * Spelled out here rather than imported from the mapper, so a swapped `picked(...)` line is
   * caught. `other` has no column: it is recorded through `open_text` only.
   */
  const EXPECTED_STEP_COLUMN: Record<FrictionArea, string | null> = {
    backup_wallet: 'step_backup_wallet',
    choosing_agent: 'step_choose_agent',
    activity_rewards: 'step_rewards_staking',
    funding_agent: 'step_funding',
    agent_activity: 'step_understanding_agent',
    everything_smooth: 'step_no_issues',
    other: null,
  };

  it('produces one cell per declared column', () => {
    const row = mapSubmissionToSheetRow(submissionBuilder(), submittedAt);
    expect(row).toHaveLength(FEEDBACK_SHEET_COLUMNS.length);
    expect(row).toHaveLength(15);
  });

  it('writes the columns in the sheet header order', () => {
    expect(namedRow()).toEqual({
      response_id: VALID_UUID,
      submitted_at: '2026-09-07T12:00:00Z',
      'rating (1-3)': 2,
      step_backup_wallet: true,
      step_choose_agent: false,
      step_rewards_staking: false,
      step_funding: true,
      step_understanding_agent: false,
      step_no_issues: false,
      open_text: 'Took a while.',
      pearl_version: '0.9.4',
      os: 'Darwin 24.3.0 (arm64)',
      agent: 'polymarket_trader',
      time_to_first_success_min: 1560, // 93600 s
      time_to_complete_survey_sec: 42,
    });
  });

  it('keeps numeric and boolean cells typed rather than stringified', () => {
    const named = namedRow();
    expect(typeof named['rating (1-3)']).toBe('number');
    expect(typeof named.step_backup_wallet).toBe('boolean');
    expect(typeof named.time_to_first_success_min).toBe('number');
    expect(typeof named.time_to_complete_survey_sec).toBe('number');
  });

  it.each(VALID_FRICTION_AREAS)('sets only the column for %s', (area) => {
    const row = mapSubmissionToSheetRow(submissionBuilder({ frictionAreas: [area] }), submittedAt);
    const selected = FEEDBACK_SHEET_COLUMNS.filter((_name, i) => row[i] === true);
    const expected = EXPECTED_STEP_COLUMN[area];
    expect(selected).toEqual(expected ? [expected] : []);
  });

  it('writes unavailable for a null time to first success', () => {
    const named = namedRow(submissionBuilder({ timeToFirstSuccessSeconds: null }));
    expect(named.time_to_first_success_min).toBe('unavailable');
  });

  it('writes 0 minutes rather than unavailable for a zero time to first success', () => {
    const named = namedRow(submissionBuilder({ timeToFirstSuccessSeconds: 0 }));
    expect(named.time_to_first_success_min).toBe(0);
  });

  it('rounds time to first success to whole minutes', () => {
    const named = namedRow(submissionBuilder({ timeToFirstSuccessSeconds: 2249 }));
    expect(named.time_to_first_success_min).toBe(37);
  });

  it('reuses the original timestamp on replay rather than the replay time', () => {
    const named = namedRow(submissionBuilder(), '2026-09-01T08:30:00.000Z');
    expect(named.submitted_at).toBe('2026-09-01T08:30:00Z');
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
