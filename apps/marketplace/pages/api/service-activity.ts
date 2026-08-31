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

// Endpoint lookup failure propagates to the outer handler → 500 uncached:
// we cannot run the mech-analytics fan-out without a multisigs / mech
// address list. Subgraph activity failure, however, only costs us the
// pending-tail rows — mech-analytics is intended to be authoritative
// for the delivered surface on 10 / 100 / 137 / 8453, so a subgraph blip
// downgrades to "no pending-tail rows this minute" rather than 500ing.
const getFromMechAnalytics = async (chainId: number, serviceId: string) => {
  const [endpoints, subgraphActivity] = await Promise.all([
    getServiceEndpointsFromMarketplaceSubgraph({
      chainId: chainId as MarketplaceSubgraphChainId,
      serviceId,
    }),
    getServiceActivityFromMarketplaceSubgraph({
      chainId: chainId as MarketplaceSubgraphChainId,
      serviceId,
    }).catch((error: unknown) => {
      console.warn(
        `[service-activity] subgraph activity fetch failed for service ${serviceId} on ` +
          `chain ${chainId}; serving mech-analytics rows only: ${String(error)}`,
      );
      return { activities: [] };
    }),
  ]);

  return getServiceActivityFromMechAnalytics({
    chainId,
    serviceId,
    multisigs: endpoints.multisigs,
    mechAddresses: endpoints.mechAddresses,
    subgraphActivities: subgraphActivity.activities,
  });
};
