import type { NextApiRequest, NextApiResponse } from 'next';
import { isAddress } from 'viem';
import { setCorsHeaders } from '../../../utils';

type SwapOwnerRequest = {
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
  chainId: number;
};

type SwapOwnerResponse = {
  success: boolean;
  txHash?: string;
  message?: string;
  error?: string;
  chainId?: number;
};

/**
 * API endpoint for Pearl Electron app to trigger Safe owner swap transactions.
 *
 * Usage from Pearl:
 * ```typescript
 * const response = await fetch('https://pearl-api.olas.network/api/web3auth/swap-owner', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     safeAddress: '0x...',
 *     oldOwnerAddress: '0x...',
 *     newOwnerAddress: '0x...',
 *     backupOwnerAddress: '0x...',
 *     chainId: 1
 *   })
 * });
 * const data = await response.json();
 * // data.success, data.txHash, data.error
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SwapOwnerResponse>,
) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress, chainId } =
      req.body as SwapOwnerRequest;

    // Validate required fields
    if (!safeAddress || !oldOwnerAddress || !newOwnerAddress || !backupOwnerAddress || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message:
          'safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress, and chainId are required',
      });
    }

    // Validate addresses
    if (
      !isAddress(safeAddress) ||
      !isAddress(oldOwnerAddress) ||
      !isAddress(newOwnerAddress) ||
      !isAddress(backupOwnerAddress)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format',
        message: 'One or more addresses are invalid',
      });
    }

    // Return session URL that Pearl should open in a browser window or webview
    // This URL will handle the Web3Auth flow and transaction execution
    const sessionUrl =
      `https://pearl-api.olas.network/web3auth/swap-owner-session?` +
      `safeAddress=${safeAddress}` +
      `&oldOwnerAddress=${oldOwnerAddress}` +
      `&newOwnerAddress=${newOwnerAddress}` +
      `&backupOwnerAddress=${backupOwnerAddress}` +
      `&chainId=${chainId}`;

    res.status(200).json({
      success: true,
      message: 'Open the session URL in a browser window to complete the transaction',
      chainId,
      // Return the URL for Pearl to open
      txHash: sessionUrl, // Using txHash field temporarily to pass URL
    });
  } catch (error) {
    console.error('Error in swap-owner API:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
