/**
 * @param {number} balanceInWei
 * @returns formatted balance with appropriate suffix
 */
export const formatWeiBalance = (balanceInWei: number | string) => {
  const formatNumberWithSuffix = (number: number) => {
    if (number >= 1e9) {
      return `${Math.floor((number / 1e9) * 10) / 10}B`;
    }
    if (number >= 1e6) {
      return `${Math.floor((number / 1e6) * 10) / 10}M`;
    }
    if (number >= 1e3) {
      return `${Math.floor((number / 1e3) * 10) / 10}k`;
    }
    return Math.floor(number * 10) / 10;
  };

  return formatNumberWithSuffix(parseFloat(`${balanceInWei}`));
};
