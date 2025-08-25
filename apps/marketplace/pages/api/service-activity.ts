import { mergeServiceActivity } from 'common-util/graphql/service-activity';
import {
  getServiceActivityFromMMSubgraph,
  getServiceActivityFromLegacyMechSubgraph,
} from 'common-util/graphql/service-activity';
import { NextApiRequest, NextApiResponse } from 'next';
import { CACHE_DURATION } from '../../util/constants';
import { isMarketplaceSupportedNetwork } from 'common-util/functions';
import { MM_GRAPHQL_CLIENTS } from 'common-util/graphql';

type RequestQuery = {
  chainId: string;
  serviceId: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chainId, serviceId } = req.query as RequestQuery;

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

    const promises = [
      getServiceActivityFromMMSubgraph({
        chainId: Number(chainId) as keyof typeof MM_GRAPHQL_CLIENTS,
        serviceId,
      }),
    ];

    // For gnosis, we need to get the data from legacy mech as well
    if (Number(chainId) === 100)
      promises.push(
        getServiceActivityFromLegacyMechSubgraph({
          serviceId,
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
