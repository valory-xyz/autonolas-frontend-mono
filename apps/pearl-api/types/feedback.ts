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

export type OnboardingSurveyResponse = {
  ok: true;
};

export type ReplayPendingResponse = {
  ok: true;
  replayed: number;
  failed: number;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};
