import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Get formatted date from milliseconds
 * example, 1678320000000 => Mar 09 '23
 */
export const getFormattedDate = (ms?: string | number | null) => {
  // TODO: should import NA from libs/constants
  // Due to not properly resolves nx/enforce-module-boundaries issue
  // it causes problems with building
  if (!ms) return 'n/a';
  return dayjs(ms).format("MMM DD 'YY");
};

/**
 * Format an ISO-8601 string or epoch-milliseconds value as an absolute UTC timestamp,
 * e.g. `7 Sep 2026, 18:42 UTC`.
 *
 * Deliberately UTC and locale-independent: this text is rendered during a static build and
 * again on the client, so anything timezone- or locale-dependent would produce a hydration
 * mismatch. Returns null for missing or unparseable input so callers can omit the line.
 */
export const formatUtcTimestamp = (value?: string | number | null): string | null => {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid()) return null;
  return `${date.utc().format('D MMM YYYY, HH:mm')} UTC`;
};
