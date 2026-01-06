import dayjs from 'dayjs';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { NA } from 'libs/util-constants/src';

/**
 * Get formatted date from milliseconds
 * example, 1678320000000 => Mar 09 '23
 */
export const getFormattedDate = (ms?: string | number | null) => {
  if (!ms) return NA;
  return dayjs(ms).format("MMM DD 'YY");
};
