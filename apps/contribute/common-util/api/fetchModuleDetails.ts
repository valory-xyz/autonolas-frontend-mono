import { ContributeModuleDetails } from 'types/moduleDetails';

import { AfmdbError, getAfmdbAttributeValuesUrl } from './afmdb';

/** Reads module details from AFMDB. Shared by `/api/module-details` and `getStaticProps`. */
export async function fetchModuleDetails(): Promise<ContributeModuleDetails[]> {
  const response = await fetch(getAfmdbAttributeValuesUrl('MODULE_DATA'));

  if (!response.ok) {
    throw new AfmdbError(`Failed to fetch module details: ${response.status}`, response.status);
  }

  return response.json();
}
