import { mergeServiceActivity } from 'common-util/apiRoute/service-activity';
import {
  getServiceActivityFromMMSubgraph,
  getServiceActivityFromLegacyMechSubgraph,
} from 'common-util/apiRoute/service-activity';
import { NextApiRequest, NextApiResponse } from 'next';

type Network = 'gnosis' | 'base';

type RequestBody = {
  network: Network;
  serviceId: string;
  limitForMM: number;
  limitForLegacy: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { network, serviceId, limitForMM, limitForLegacy } = JSON.parse(req.body) as RequestBody;

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

    const promises = [getServiceActivityFromMMSubgraph({ network, serviceId, limit: limitForMM })];

    // For gnosis, we need to get the data from legacy mech as well
    if (network === 'gnosis')
      promises.push(getServiceActivityFromLegacyMechSubgraph({ serviceId, limit: limitForLegacy }));

    const [servicesFromMM, servicesFromLegacy] = await Promise.all(promises);
    const services = mergeServiceActivity(servicesFromMM, servicesFromLegacy);
    return res.status(200).json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
