import { isNil } from 'lodash';

/**
 * Return formatted number with appropriate suffix
 */
export const formatWeiNumber = ({
  value,
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
}: {
  value: number | string | undefined;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}) => {
  if (isNil(value) || Number(value) === 0) return '0';

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(value));
};
