import { getServiceActivityFromMarketplaceSubgraph } from 'common-util/graphql/service-activity';
import { NextApiRequest, NextApiResponse } from 'next';
import { CACHE_DURATION } from '../../util/constants';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import { MARKETPLACE_SUBGRAPH_CLIENTS } from 'common-util/graphql';

type RequestQuery = {
  chainId: string;
  serviceId: string;
  latest?: string; // Param to fetch latest data.
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chainId, serviceId, latest } = req.query as RequestQuery;

    if (!chainId || !serviceId) {
      return res.status(400).json({
        error: 'Missing required parameters: chainId and serviceId',
      });
    }

    if (!isMarketplaceSupportedNetwork(Number(chainId))) {
      return res.status(400).json({
        error: "Invalid network. Must be 'gnosis' or 'base'",
      });
    }

    const services = await getServiceActivityFromMarketplaceSubgraph({
      chainId: Number(chainId) as keyof typeof MARKETPLACE_SUBGRAPH_CLIENTS,
      serviceId,
    });

    // If 'latest' parameter is present, disable caching to force fresh data
    if (latest) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader(
        'Cache-Control',
        `public, s-maxage=${CACHE_DURATION.ONE_HOUR}, stale-while-revalidate=${CACHE_DURATION.ONE_HOUR}`,
      );
    }

    return res.status(200).json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
