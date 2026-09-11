import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchModuleDetails } from 'common-util/api/fetchModuleDetails';

export const MODULE_DETAILS_ERROR_MESSAGE = 'Failed to fetch module details.';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json(await fetchModuleDetails());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: MODULE_DETAILS_ERROR_MESSAGE, details: error });
  }
}
