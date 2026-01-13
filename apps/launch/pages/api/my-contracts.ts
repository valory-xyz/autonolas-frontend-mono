import { getStakingContractsBySender, hasSubgraphSupport } from 'common-util/graphql/my-contracts';
import { NextApiRequest, NextApiResponse } from 'next';

type RequestQuery = {
  chainId: string;
  address: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chainId, address } = req.query as RequestQuery;

    if (!chainId || !address) {
      return res.status(400).json({
        error: 'Missing required parameters: chainId and address',
      });
    }

    const chainIdNumber = parseInt(chainId, 10);

    if (!hasSubgraphSupport(chainIdNumber)) {
      return res.status(400).json({
        error: 'Chain does not have subgraph support',
      });
    }

    const response = await getStakingContractsBySender({
      chain: chainIdNumber,
      senderId: address,
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
