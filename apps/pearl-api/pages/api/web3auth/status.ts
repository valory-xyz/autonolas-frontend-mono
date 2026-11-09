import type { NextApiRequest, NextApiResponse } from 'next';

import type { Web3AuthStatusResponse } from 'types/web3auth';
import { setCorsHeaders } from 'utils/cors';
import { isWeb3AuthEnabled } from 'utils/web3authFlag';

type ErrorResponse = {
  error: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Web3AuthStatusResponse | ErrorResponse>,
) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // The flag changes with a redeploy, so no cached copy may outlive one.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ enabled: isWeb3AuthEnabled() });
}
