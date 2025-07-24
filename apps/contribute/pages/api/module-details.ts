import type { NextApiRequest, NextApiResponse } from 'next';

import { ContributeModuleDetails } from 'types/moduleDetails';

const AGENT_TYPE = process.env.AGENT_TYPE_ID;
const ATTRIBUTE_TYPE_ID = 4;

export const MODULE_DETAILS_API_BASE_URL = `${process.env.NEXT_PUBLIC_AFMDB_URL}/api/agent-types/${AGENT_TYPE}/attributes/${ATTRIBUTE_TYPE_ID}/values`;

export const MODULE_DETAILS_ERROR_MESSAGE = 'Failed to fetch module details.';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(MODULE_DETAILS_API_BASE_URL);

    if (!response.ok) {
      return res.status(response.status).json({ error: MODULE_DETAILS_ERROR_MESSAGE });
    }

    const data: ContributeModuleDetails = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: MODULE_DETAILS_ERROR_MESSAGE, details: error });
  }
}
