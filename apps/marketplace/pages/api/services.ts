import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getServicesFromMMSubgraph,
  getServicesFromLegacyMechSubgraph,
  mergeServicesDetails,
} from 'common-util/graphql/services';
import type { MarketplaceSupportedNetwork } from 'common-util/types';

import { CACHE_DURATION, MARKETPLACE_SUPPORTED_NETWORKS } from '../../util/constants';

type RequestQuery = {
  network: MarketplaceSupportedNetwork;
  serviceIds: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { network, serviceIds = '' } = req.query as RequestQuery;
    const parsedServiceIds = serviceIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!network || !parsedServiceIds.length) {
      return res.status(400).json({
        error: 'Missing required parameters: network and serviceIds',
      });
    }

    if (
      network !== MARKETPLACE_SUPPORTED_NETWORKS.GNOSIS &&
      network !== MARKETPLACE_SUPPORTED_NETWORKS.BASE
    ) {
      return res.status(400).json({
        error: "Invalid network. Must be 'gnosis' or 'base'",
      });
    }

    const promises = [
      getServicesFromMMSubgraph({
        network: network as MarketplaceSupportedNetwork,
        serviceIds: parsedServiceIds,
      }),
    ];

    // For gnosis, we need to get the data from legacy mech as well
    if (network === MARKETPLACE_SUPPORTED_NETWORKS.GNOSIS)
      promises.push(getServicesFromLegacyMechSubgraph({ serviceIds: parsedServiceIds }));

    const [servicesFromMM, servicesFromLegacy] = await Promise.all(promises);
    const services = mergeServicesDetails(servicesFromMM, servicesFromLegacy);

    res.setHeader(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION.TWELVE_HOURS}, stale-while-revalidate=${CACHE_DURATION.ONE_HOUR}`,
    );

    return res.status(200).json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
