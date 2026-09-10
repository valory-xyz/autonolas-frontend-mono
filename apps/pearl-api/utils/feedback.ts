import {
  EVERYTHING_SMOOTH,
  FEEDBACK_COMMENT_MAX_LENGTH,
  FEEDBACK_SHORT_FIELD_MAX_LENGTH,
  TIME_TO_FIRST_SUCCESS_UNAVAILABLE,
  VALID_FRICTION_AREAS,
  VALID_RATINGS,
} from '../constants';
import type {
  FrictionArea,
  OnboardingSurveySubmission,
  PendingFeedbackRecord,
  SheetCell,
  SurveyOs,
  SurveyRating,
} from '../types/feedback';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFrictionArea = (value: unknown): value is FrictionArea =>
  typeof value === 'string' && (VALID_FRICTION_AREAS as readonly string[]).includes(value);

const isSurveyRating = (value: unknown): value is SurveyRating =>
  typeof value === 'number' && (VALID_RATINGS as readonly number[]).includes(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const parseShortField = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > FEEDBACK_SHORT_FIELD_MAX_LENGTH) return null;
  return trimmed;
};

const parseOs = (value: unknown): SurveyOs | null => {
  if (!isRecord(value)) return null;

  const type = parseShortField(value.type);
  const platform = parseShortField(value.platform);
  const arch = parseShortField(value.arch);
  const release = parseShortField(value.release);

  if (!type || !platform || !arch || !release) return null;

  return { type, platform, arch, release };
};

const parseFrictionAreas = (value: unknown): FrictionArea[] | null => {
  if (!Array.isArray(value)) return null;
  if (!value.every(isFrictionArea)) return null;
  if (new Set(value).size !== value.length) return null;

  // The design separates the fast-exit card from the friction list, so it cannot be combined.
  if (value.includes(EVERYTHING_SMOOTH) && value.length !== 1) return null;

  return value;
};

const parseComment = (value: unknown): string | null => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > FEEDBACK_COMMENT_MAX_LENGTH ? null : trimmed;
};

/**
 * Validates an onboarding-survey request body.
 *
 * Follows the app's `parseAchievementApiQueryParams` idiom: returns a typed submission, or
 * `null` on any failure so the handler owns the 400. Every field is checked before the handler
 * makes an outbound call, and only the fields named here survive — an unexpected extra property
 * in the request cannot reach the sheet or the pending buffer.
 */
export const parseOnboardingSurveySubmission = (
  body: unknown,
): OnboardingSurveySubmission | null => {
  if (!isRecord(body)) return null;

  const { submissionId } = body;
  if (typeof submissionId !== 'string' || !UUID_V4_PATTERN.test(submissionId)) return null;

  const frictionAreas = parseFrictionAreas(body.frictionAreas);
  if (!frictionAreas) return null;

  if (!isSurveyRating(body.rating)) return null;

  const comment = parseComment(body.comment);
  if (comment === null) return null;

  const os = parseOs(body.os);
  if (!os) return null;

  const agentType = parseShortField(body.agentType);
  if (!agentType) return null;

  const pearlVersion = parseShortField(body.pearlVersion);
  if (!pearlVersion) return null;

  // `null` is a meaningful value here (no first-open timestamp) and must not become 0.
  const { timeToFirstSuccessSeconds } = body;
  if (timeToFirstSuccessSeconds !== null && !isNonNegativeInteger(timeToFirstSuccessSeconds)) {
    return null;
  }

  if (!isNonNegativeInteger(body.timeToCompleteSurveySeconds)) return null;

  return {
    submissionId,
    frictionAreas,
    rating: body.rating,
    comment,
    os,
    agentType,
    pearlVersion,
    timeToFirstSuccessSeconds,
    timeToCompleteSurveySeconds: body.timeToCompleteSurveySeconds,
  };
};

const SECONDS_PER_MINUTE = 60;

/** `2026-09-02T14:32:10Z`, the second-precision form the sheet's examples use. */
const toSheetTimestamp = (isoTimestamp: string): string => isoTimestamp.replace(/\.\d{3}Z$/, 'Z');

/**
 * Maps a validated submission to the sheet's row, in `FEEDBACK_SHEET_COLUMNS` order.
 *
 * Reads the typed submission rather than the request body, so nothing outside the validated
 * fields can reach a cell. `submittedAt` is supplied by the caller so a cron replay writes the
 * original submission time.
 */
export const mapSubmissionToSheetRow = (
  submission: OnboardingSurveySubmission,
  submittedAt: string,
): SheetCell[] => {
  const picked = (area: FrictionArea) => submission.frictionAreas.includes(area);
  const { os } = submission;

  return [
    submission.submissionId,
    toSheetTimestamp(submittedAt),
    submission.rating,
    picked('backup_wallet'),
    picked('choosing_agent'),
    picked('activity_rewards'),
    picked('funding_agent'),
    picked('agent_activity'),
    picked(EVERYTHING_SMOOTH),
    submission.comment,
    submission.pearlVersion,
    `${os.type} ${os.release} (${os.arch})`,
    submission.agentType,
    submission.timeToFirstSuccessSeconds === null
      ? TIME_TO_FIRST_SUCCESS_UNAVAILABLE
      : Math.round(submission.timeToFirstSuccessSeconds / SECONDS_PER_MINUTE),
    submission.timeToCompleteSurveySeconds,
    picked('other'),
  ];
};

/**
 * Parses the text of a buffered blob back into a record the replay can append.
 *
 * The submission is re-run through the same validator the submit route uses, so the replay
 * path carries the same "only the typed value reaches the sheet" guarantee. Returns `null` for
 * anything unparseable so the caller can quarantine it instead of retrying forever.
 */
export const parsePendingFeedbackRecord = (body: string): PendingFeedbackRecord | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (typeof parsed.submittedAt !== 'string' || Number.isNaN(Date.parse(parsed.submittedAt))) {
    return null;
  }

  const submission = parseOnboardingSurveySubmission(parsed.submission);
  if (!submission) return null;

  return { submittedAt: parsed.submittedAt, submission };
};

/** `application/json`, with or without a `; charset=...` parameter. */
export const isJsonContentType = (contentType: string | string[] | undefined): boolean =>
  typeof contentType === 'string' && contentType.split(';')[0].trim() === 'application/json';
