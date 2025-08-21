import { mergeServiceActivity } from 'common-util/apiRoute/service-activity';
import {
  getServiceActivityFromMMSubgraph,
  getServiceActivityFromLegacyMechSubgraph,
} from 'common-util/apiRoute/service-activity';
import { NextApiRequest, NextApiResponse } from 'next';
import { CACHE_DURATION } from '../../util/constants';

type Network = 'gnosis' | 'base';

type RequestQuery = {
  network: Network;
  serviceId: string;
  limitForMM: string;
  limitForLegacy: string;
};

const DEFAULT_LIMIT = 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { network, serviceId, limitForMM, limitForLegacy } = req.query as RequestQuery;
    const parsedLimitForMM = limitForMM ? parseInt(limitForMM, 10) : DEFAULT_LIMIT;
    const parsedLimitForLegacy = limitForLegacy ? parseInt(limitForLegacy, 10) : DEFAULT_LIMIT;

    if (!network || !serviceId) {
      return res.status(400).json({
        error: 'Missing required parameters: network and serviceId',
      });
    }

    if (network !== 'gnosis' && network !== 'base') {
      return res.status(400).json({
        error: "Invalid network. Must be 'gnosis' or 'base'",
      });
    }

    const promises = [
      getServiceActivityFromMMSubgraph({
        network,
        serviceId,
        limit: parsedLimitForMM,
      }),
    ];

    // For gnosis, we need to get the data from legacy mech as well
    if (network === 'gnosis')
      promises.push(
        getServiceActivityFromLegacyMechSubgraph({
          serviceId,
          limit: parsedLimitForLegacy,
        }),
      );

    const [servicesFromMM, servicesFromLegacy] = await Promise.all(promises);
    const services = mergeServiceActivity(servicesFromMM, servicesFromLegacy);

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
