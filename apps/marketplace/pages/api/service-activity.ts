import { getServiceActivityFromMarketplaceSubgraph } from 'common-util/graphql/service-activity';
import { getServiceEndpointsFromMarketplaceSubgraph } from 'common-util/graphql/services';
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

// Union of latest + historical multisigs so multisig-swapped services
// still return their full history. Registry / subgraph failure
// propagates to the outer handler → 500 uncached, matching the subgraph
// path shape. Swallowing here would pin an empty activity list at the
// CDN for an hour on a transient blip.
const getFromMechAnalytics = async (chainId: number, serviceId: string) => {
  // Fire the endpoint lookup + subgraph activity fetch in parallel.
  // Subgraph activity is unioned into the mech-analytics result for
  // the pending-tail gap: mech-analytics holds undelivered requests
  // out of its scored + unscored surfaces for ~24h, so a freshly-fired
  // request would otherwise not render until the day-old floor lifts.
  const [{ multisigs, mechAddresses }, subgraphActivity] = await Promise.all([
    getServiceEndpointsFromMarketplaceSubgraph({
      chainId: chainId as MarketplaceSubgraphChainId,
      serviceId,
    }),
    getServiceActivityFromMarketplaceSubgraph({
      chainId: chainId as MarketplaceSubgraphChainId,
      serviceId,
    }),
  ]);

  return getServiceActivityFromMechAnalytics({
    chainId,
    serviceId,
    multisigs,
    mechAddresses,
    subgraphActivities: subgraphActivity.activities,
  });
};
