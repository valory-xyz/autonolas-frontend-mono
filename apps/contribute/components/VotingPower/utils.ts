import { ethers } from 'ethers';

/**
 *
 * @param {string} balanceInWei
 * @returns formatted balance with appropriate suffix
 */
export const formatWeiBalance = (balanceInWei: string) => {
  const balanceInEther = ethers.formatEther(balanceInWei);

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

  return formatNumberWithSuffix(parseFloat(balanceInEther));
};

function formatNumberWithCommas(number: number) {
  return number.toLocaleString();
}

/**
 *
 * @param {string} balanceInWei
 * @returns formated balance with commas and no digits after decimal point
 */
export const formatWeiBalanceWithCommas = (balanceInWei: string) => {
  const balanceInEther = ethers.formatEther(balanceInWei);

  const finalBalance = formatNumberWithCommas(parseInt(balanceInEther));

  return finalBalance;
};

/**
 * Truncates an Ethereum address to show the first startLimit characters,
 * a ..., and the last endLimit characters
 * @param {string} address - The Ethereum address to truncate
 * @returns {string} The truncated address
 */
export const truncateAddress = (address: string, startLimit = 5, endLimit = 3) =>
  address
    ? `${address.substring(0, startLimit)}...${address.substring(address.length - endLimit)}`
    : '--';

export const validateBeforeDelegate = async ({
  account,
  balance,
  delegatee,
  newDelegatee,
}: {
  account: string;
  balance: string;
  delegatee: string;
  newDelegatee: string;
}) => {
  if (newDelegatee === account) {
    throw new Error('NoSelfDelegation');
  }

  if (delegatee === newDelegatee) {
    throw new Error('AlreadyDelegatedToSameDelegatee');
  }

  if (balance === '0') {
    throw new Error('NoBalance');
  }
};

export const DELEGATE_ERRORS_MAP: Record<string, string> = {
  NoSelfDelegation: "Can't delegate to yourself",
  AlreadyDelegatedToSameDelegatee: 'You already delegated to this delegatee',
  NoBalance: 'No balance available to delegate',
};
