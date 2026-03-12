import isNil from 'lodash/isNil';

/**
 * Converts a number to a comma separated format
 * eg: 1000000 => 1,000,000, 12345.67 => 12,345.67
 */
export const getCommaSeparatedNumber = (value: number | string | undefined) => {
  if (isNil(value) || Number(value) === 0) return '0';

  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
  }).format(Number(value));
};
