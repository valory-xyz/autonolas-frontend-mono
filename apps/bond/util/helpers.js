import { message } from 'antd';

/**
 * Truncates an Ethereum address to show the first seven characters,
 * a ..., and the last three characters
 * @param {string} address - The Ethereum address to truncate
 * @returns {string} The truncated address
 */
export const truncateAddress = (address) => (
  address ? `${address.substring(0, 7)}...${address.substring(address.length - 3)}` : '--'
);

/**
 * Handles copying text to the clipboard
 * @param {string} copyText - The text to copy
 */
export const handleCopy = async (copyText) => {
  try {
    await navigator.clipboard.writeText(copyText);
    message.success('Copied');
  } catch {
    message.error("Couldn't copy");
  }
};

/**
 * Returns the base URL of the explorer for a given network ID
 * @param {string} networkId - The network ID to get the explorer base URL for
 * @returns {string} The base URL of the explorer for the given network ID
 */
export const getExplorerBaseUrl = (networkId) => {
  const networkMap = {
    'gnosis-chain': 'https://gnosisscan.io/address/',
    arbitrum: 'https://arbiscan.io/address/',
    'polygon-pos': 'https://polygonscan.com/address/',
    optimism: 'https://optimistic.etherscan.io/address/',
    base: 'https://basescan.org/address/',
    solana: 'https://solscan.io/token/',
  };
  return networkMap[networkId] || 'https://etherscan.io/address/';
};
