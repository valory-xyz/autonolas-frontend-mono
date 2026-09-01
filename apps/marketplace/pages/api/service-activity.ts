import { getServiceActivityFromMarketplaceSubgraph } from 'common-util/graphql/service-activity';
import { getServiceEndpointsFromMarketplaceSubgraph } from 'common-util/graphql/services';
import { getServiceActivityFromMechAnalytics } from 'common-util/mechAnalytics/service-activity';
import { shouldUseMechAnalytics } from 'common-util/mechAnalytics/config';
import { NextApiRequest, NextApiResponse } from 'next';
import { CACHE_DURATION, MARKETPLACE_SUPPORTED_CHAIN_IDS } from '../../util/constants';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import type { MarketplaceSubgraphChainId } from 'common-util/graphql';
import type { ServiceActivity } from 'common-util/types';

type RequestQuery = {
  chainId: string;
  serviceId: string;
  latest?: string;
};

// Marketplace subgraph service ids are numeric strings (the on-chain
// serviceId). The value flows straight into a GraphQL doc via
// interpolation in getServiceEndpointsFromMarketplaceSubgraph and
// getServiceActivityFromMarketplaceSubgraph, so a query-string with
// `") { id } ...` in it could reshape the query. Bounding to digits
// closes that at the boundary; the field is uint256 upstream so
// digits-only is the correct shape anyway.
const SERVICE_ID_RE = /^\d+$/;

// Shortened TTL when at least one mech-analytics shard failed. Any
// transient upstream blip is otherwise pinned at the CDN for the
// normal 1h + 1h stale-while-revalidate window, hiding the recovery
// from the FE for up to two hours.
const DEGRADED_CACHE_SECONDS = 60;

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

    if (!SERVICE_ID_RE.test(serviceId)) {
      return res.status(400).json({ error: 'Invalid serviceId' });
    }

    const chainIdNumber = Number(chainId);
    if (!isMarketplaceSupportedNetwork(chainIdNumber)) {
      return res.status(400).json({
        error: `Invalid network. Supported chain IDs: ${MARKETPLACE_SUPPORTED_CHAIN_IDS.join(', ')}`,
      });
    }

    const services: ServiceActivity = shouldUseMechAnalytics(chainIdNumber)
      ? await getFromMechAnalytics(chainIdNumber, serviceId)
      : await getServiceActivityFromMarketplaceSubgraph({
          chainId: chainIdNumber as MarketplaceSubgraphChainId,
          serviceId,
        });

    if (latest) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (services.degraded) {
      // Degraded response — some mech-analytics shards failed. Serve
      // for 60 s and skip stale-while-revalidate so recovery isn't
      // hidden behind the normal 1h + 1h SWR window.
      res.setHeader('Cache-Control', `public, s-maxage=${DEGRADED_CACHE_SECONDS}`);
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
// pending-tail rows and the twin-side USD amounts, so it downgrades
// to a partial response rather than 500ing. The failure gets folded
// into ``degraded`` alongside mech-analytics shard failures so the
// route's 60s TTL branch fires for either source (without this,
// without this, a subgraph blip would still get cached for the full 1h + 1h).
const getFromMechAnalytics = async (
  chainId: number,
  serviceId: string,
): Promise<ServiceActivity> => {
  let subgraphDegraded = false;
  const [endpoints, subgraphActivity] = await Promise.all([
    getServiceEndpointsFromMarketplaceSubgraph({
      chainId: chainId as MarketplaceSubgraphChainId,
      serviceId,
    }),
    getServiceActivityFromMarketplaceSubgraph({
      chainId: chainId as MarketplaceSubgraphChainId,
      serviceId,
    }).catch((error: unknown) => {
      subgraphDegraded = true;
      console.warn(
        `[service-activity] subgraph activity fetch failed for service ${serviceId} on ` +
          `chain ${chainId}; serving mech-analytics rows only: ${String(error)}`,
      );
      return { activities: [] };
    }),
  ]);

  const result = await getServiceActivityFromMechAnalytics({
    chainId,
    serviceId,
    multisigs: endpoints.multisigs,
    mechAddresses: endpoints.mechAddresses,
    subgraphActivities: subgraphActivity.activities,
  });

  return {
    ...result,
    degraded: result.degraded || subgraphDegraded,
  };
};
