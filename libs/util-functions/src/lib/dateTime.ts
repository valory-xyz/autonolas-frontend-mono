import dayjs from 'dayjs';

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
