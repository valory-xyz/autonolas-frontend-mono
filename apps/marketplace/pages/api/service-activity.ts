import { getServiceActivityFromMarketplaceSubgraph } from 'common-util/graphql/service-activity';
import { getServiceMultisigsFromMarketplaceSubgraph } from 'common-util/graphql/services';
import { getServiceActivityFromMechAnalytics } from 'common-util/mechAnalytics/service-activity';
import { shouldUseMechAnalytics } from 'common-util/mechAnalytics/config';
import { NextApiRequest, NextApiResponse } from 'next';
import { CACHE_DURATION, MARKETPLACE_SUPPORTED_CHAIN_IDS } from '../../util/constants';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import type { MarketplaceSubgraphChainId } from 'common-util/graphql';

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

    const chainIdNumber = Number(chainId);
    if (!isMarketplaceSupportedNetwork(chainIdNumber)) {
      return res.status(400).json({
        error: `Invalid network. Supported chain IDs: ${MARKETPLACE_SUPPORTED_CHAIN_IDS.join(', ')}`,
      });
    }

    const services = shouldUseMechAnalytics(chainIdNumber)
      ? await getFromMechAnalytics(chainIdNumber, serviceId)
      : await getServiceActivityFromMarketplaceSubgraph({
          chainId: chainIdNumber as MarketplaceSubgraphChainId,
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

// Fetch the union of every multisig the service has held (latest +
// historical) so the mech-analytics envelope matches the subgraph
// path, which queries by serviceId. Multisig-swap history matters
// for services that ever rotated their safe.
// Subgraph failure or a not-yet-launched service degrades to an
// empty activity page.
const getFromMechAnalytics = async (chainId: number, serviceId: string) => {
  const multisigs = await getServiceMultisigsFromMarketplaceSubgraph({
    chainId: chainId as MarketplaceSubgraphChainId,
    serviceId,
  }).catch(() => [] as string[]);

  return getServiceActivityFromMechAnalytics({
    chainId,
    serviceId,
    multisigs,
  });
};
