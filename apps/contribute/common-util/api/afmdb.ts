/** Thrown when AFMDB answers with a non-2xx, so API routes can forward that status. */
export class AfmdbError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AfmdbError';
  }
}

type AttributeKey = 'USER' | 'MODULE_DATA';

/**
 * Builds the AFMDB values URL for one attribute, validating the env once for every caller. The
 * ids in ATTRIBUTE_ID_MAPPING are JSON numbers ({"USER":8}); requiring strings once 500'd the
 * leaderboard route, and an unguarded parse put the string "undefined" in the URL. Accept either.
 */
export const getAfmdbAttributeValuesUrl = (attribute: AttributeKey): string => {
  const afmdbUrl = process.env.NEXT_PUBLIC_AFMDB_URL;
  const agentTypeId = process.env.AGENT_TYPE_ID;
  const attributeIdMappingRaw = process.env.ATTRIBUTE_ID_MAPPING;

  if (!afmdbUrl || !agentTypeId || !attributeIdMappingRaw) {
    throw new Error(
      'Missing required environment variables for AFMDB. ' +
        'Ensure NEXT_PUBLIC_AFMDB_URL, AGENT_TYPE_ID, and ATTRIBUTE_ID_MAPPING are set.',
    );
  }

  let attributeTypeId: string | number | undefined;
  try {
    attributeTypeId = (JSON.parse(attributeIdMappingRaw) as Record<string, unknown>)[attribute] as
      | string
      | number
      | undefined;
  } catch {
    throw new Error('Invalid ATTRIBUTE_ID_MAPPING environment variable');
  }
  if (typeof attributeTypeId !== 'string' && typeof attributeTypeId !== 'number') {
    throw new Error(`ATTRIBUTE_ID_MAPPING.${attribute} must be a string or a number`);
  }

  return `${afmdbUrl}/api/agent-types/${agentTypeId}/attributes/${attributeTypeId}/values`;
};
