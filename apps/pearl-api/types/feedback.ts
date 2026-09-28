import { VALID_FRICTION_AREAS, VALID_RATINGS } from '../constants';

export type FrictionArea = (typeof VALID_FRICTION_AREAS)[number];

export type SurveyRating = (typeof VALID_RATINGS)[number];

export type SurveyOs = {
  type: string;
  platform: string;
  arch: string;
  release: string;
};

/**
 * One onboarding-survey submission, after validation.
 *
 * Deliberately carries no wallet address, account id or device fingerprint: the survey is
 * anonymous by product requirement, and `submissionId` is a per-submission random UUID that
 * identifies nobody. Nothing identifying may be added here — the row mapper and the pending-blob
 * writer both work from this type, so it is what bounds what can reach the sheet.
 */
export type OnboardingSurveySubmission = {
  submissionId: string;
  frictionAreas: FrictionArea[];
  rating: SurveyRating;
  comment: string;
  os: SurveyOs;
  agentType: string;
  pearlVersion: string;
  /** `null` when Pearl has no first-open timestamp; written to the sheet as `unavailable`. */
  timeToFirstSuccessSeconds: number | null;
  timeToCompleteSurveySeconds: number;
};

/**
 * What a buffered submission looks like in Blob.
 *
 * `submittedAt` is captured when the request arrived, not when the replay runs, so a replayed
 * row carries the original submission time.
 */
export type PendingFeedbackRecord = {
  submittedAt: string;
  submission: OnboardingSurveySubmission;
};

/**
 * Result of reading one buffered record (a survey submission or a funding request).
 *
 * `missing` means the blob vanished between the list and the read (a concurrent run took it) and
 * there is nothing left to do; `unreadable` can never be mapped to a row, and carries the raw
 * bytes so the caller can set them aside without discarding them.
 */
export type PendingRecordRead<T> =
  | { status: 'ok'; record: T }
  | { status: 'missing' }
  | { status: 'unreadable'; raw: string };

export type PendingFeedbackRead = PendingRecordRead<PendingFeedbackRecord>;

/**
 * One sheet cell. Numbers and booleans are kept typed rather than stringified so the sheet
 * gets numeric/boolean cells under `valueInputOption=RAW` and AVERAGE/filters work on them.
 */
export type SheetCell = string | number | boolean;

export type OnboardingSurveyResponse = {
  ok: true;
};

/** What one replay run did with one kind of buffered record. */
export type ReplayCounts = {
  /** Appended to the sheet. */
  replayed: number;
  /** Append failed; left in the pending prefix for the next run. */
  failed: number;
  /** Unparseable; moved to the unreadable prefix and never retried. */
  quarantined: number;
  /** Appended but the delete failed, so the next run will append it again. */
  undeleted: number;
};

/** Top-level counts are the onboarding survey's; funding requests are reported alongside. */
export type ReplayPendingResponse = ReplayCounts & {
  /** `false` when anything failed or was left undeleted; the route then answers 500. */
  ok: boolean;
  fundingRequests: ReplayCounts;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};
