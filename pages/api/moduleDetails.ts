import type { NextApiRequest, NextApiResponse } from 'next';

import { ContributeModuleDetails } from 'types/moduleDetails';

// TODO: Update this once we point to prod.
const AGENT_TYPE = 1;
const ATTRIBUTE_TYPE_ID = 4;

const BASE_URL = `${process.env.NEXT_PUBLIC_AFMDB_URL}/api/agent-types/${AGENT_TYPE}/attributes/${ATTRIBUTE_TYPE_ID}/values`;

const errorMessage = 'Failed to fetch module details.';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(BASE_URL);

    if (!response.ok) {
      return res.status(response.status).json({ error: errorMessage });
    }

    const data: ContributeModuleDetails = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: errorMessage, details: error });
  }
}
