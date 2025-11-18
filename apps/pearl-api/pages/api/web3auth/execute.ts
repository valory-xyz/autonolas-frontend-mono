import type { NextApiRequest, NextApiResponse } from 'next';
import { isAddress } from 'viem';
import { setCorsHeaders } from '../../../utils';

type ExecuteRequest = {
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
};

type ExecuteResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ExecuteResponse>) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress } =
      req.body as ExecuteRequest;

    // Validate required fields
    if (!safeAddress || !oldOwnerAddress || !newOwnerAddress || !backupOwnerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'One or more of the required fields is missing',
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
        message: 'One or more of the provided addresses is invalid',
      });
    }

    // Note: Actual transaction execution happens on the client side via Web3Auth
    // This API endpoint serves as a validation and coordination layer
    res.status(200).json({
      success: true,
      message: 'Request validated. Proceed with transaction execution on client side.',
    });
  } catch (error) {
    console.error('Error in execute API:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
