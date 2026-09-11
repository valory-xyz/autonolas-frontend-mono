import { ContributeModuleDetails } from 'types/moduleDetails';

/** Reads module details from AFMDB. Shared by `/api/module-details` and `getStaticProps`. */
export async function fetchModuleDetails(): Promise<ContributeModuleDetails[]> {
  const afmdbUrl = process.env.NEXT_PUBLIC_AFMDB_URL;
  const agentTypeId = process.env.AGENT_TYPE_ID;
  const attributeIdMappingRaw = process.env.ATTRIBUTE_ID_MAPPING;

  if (!afmdbUrl || !agentTypeId || !attributeIdMappingRaw) {
    throw new Error(
      'Missing required environment variables for module details fetch. ' +
        'Ensure NEXT_PUBLIC_AFMDB_URL, AGENT_TYPE_ID, and ATTRIBUTE_ID_MAPPING are set.',
    );
  }

  // Written as a JSON number ({"MODULE_DATA":10}) and only ever used in a URL, so accept either.
  const attributeTypeId = String(
    (JSON.parse(attributeIdMappingRaw) as Record<string, string | number>).MODULE_DATA,
  );

  const url = `${afmdbUrl}/api/agent-types/${agentTypeId}/attributes/${attributeTypeId}/values`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch module details: ${response.status}`);
  }

  return response.json();
}
