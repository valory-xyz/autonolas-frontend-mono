import type { NextApiRequest, NextApiResponse } from 'next';

import { getSignature } from 'common-util/apiRoute';
import { getNowTimestamp } from 'common-util/functions/time';
import { ContributeAgent } from 'types/users';

const ENDPOINT_URL = '/api/agent-attributes';
const BASE_URL = `${process.env.NEXT_PUBLIC_AFMDB_URL}${ENDPOINT_URL}`;
const ERROR_MESSAGE = 'Failed to update user profile.';

const getUpdatedStakingParams = (
  stakingParams: Pick<
    ContributeAgent['json_value'],
    'service_id' | 'service_id_old' | 'service_multisig' | 'service_multisig_old'
  >,
  agent: ContributeAgent,
) => ({
  service_id:
    'service_id' in stakingParams ? stakingParams.service_id : agent.json_value.service_id,
  service_id_old:
    'service_id_old' in stakingParams
      ? stakingParams.service_id_old
      : agent.json_value.service_id_old,
  service_multisig:
    'service_multisig' in stakingParams
      ? stakingParams.service_multisig
      : agent.json_value.service_multisig,
  service_multisig_old:
    'service_multisig_old' in stakingParams
      ? stakingParams.service_multisig_old
      : agent.json_value.service_multisig_old,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.status(405).end();
    return;
  }

  try {
    const { attributeId, ...stakingParams } = req.body;

    // Load the latest fresh data so as not to replace with stale one
    const agentResponse = await fetch(`${BASE_URL}/${attributeId}`);
    if (agentResponse.status === 404) {
      res.status(404).json({ error: `${ERROR_MESSAGE} Agent not found` });
      return;
    }
    const agent: ContributeAgent = await agentResponse.json();

    // Create a signature for updating the data
    const message = `timestamp:${getNowTimestamp()},endpoint:${ENDPOINT_URL}/${attributeId}`;
    const signature = await getSignature(message);

    // Send update to database
    const response = await fetch(`${BASE_URL}/${attributeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_attr: {
          ...agent,
          last_updated: undefined,
          json_value: {
            ...agent.json_value,
            // only update staking parameters if provided
            ...getUpdatedStakingParams(stakingParams, agent),
          },
        },
        auth: {
          agent_id: agent.agent_id,
          signature,
          message,
        },
      }),
    });

    if (!response.ok) {
      res.status(response.status).json({ error: ERROR_MESSAGE });
    }

    const result: ContributeAgent = await response.json();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: ERROR_MESSAGE, details: error });
  }
}
