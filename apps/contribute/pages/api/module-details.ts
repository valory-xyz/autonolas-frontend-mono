import type { NextApiRequest, NextApiResponse } from 'next';

import { AfmdbError } from 'common-util/api/afmdb';
import { fetchModuleDetails } from 'common-util/api/fetchModuleDetails';

export const MODULE_DETAILS_ERROR_MESSAGE = 'Failed to fetch module details.';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    res.status(200).json(await fetchModuleDetails());
  } catch (error) {
    console.error(error);
    const status = error instanceof AfmdbError ? error.status : 500;
    res.status(status).json({ error: MODULE_DETAILS_ERROR_MESSAGE, details: error });
  }
}
