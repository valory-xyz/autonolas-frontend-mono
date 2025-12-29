import type { NextApiRequest, NextApiResponse } from 'next';
import { getServicesFromMarketplaceSubgraph } from 'common-util/graphql/services';

import { CACHE_DURATION } from '../../util/constants';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import { MARKETPLACE_SUBGRAPH_CLIENTS } from 'common-util/graphql';

type RequestQuery = {
  chainId: string;
  serviceIds: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chainId, serviceIds = '' } = req.query as RequestQuery;
    const parsedServiceIds = serviceIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!chainId || !parsedServiceIds.length) {
      return res.status(400).json({
        error: 'Missing required parameters: chainId and serviceIds',
      });
    }

    if (!isMarketplaceSupportedNetwork(Number(chainId))) {
      return res.status(400).json({
        error: "Invalid network. Must be 'gnosis' or 'base'",
      });
    }

    const services = await getServicesFromMarketplaceSubgraph({
      chainId: Number(chainId) as keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS,
      serviceIds: parsedServiceIds,
    });

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.ONE_HOUR}, stale-while-revalidate=${CACHE_DURATION.ONE_HOUR}`,
    );

    return res.status(200).json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
