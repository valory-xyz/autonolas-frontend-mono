import { gql, GraphQLClient } from 'graphql-request';

import { TOTAL_VIEW_COUNT } from 'util/constants';

/**
 * Server-side reads of the registry subgraph for the listing pages. The queries mirror the ones
 * in each list's hooks — if those change, change these too.
 */

const client = () => {
  const url = process.env.NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL;
  if (!url) throw new Error('NEXT_PUBLIC_AUTONOLAS_SUB_GRAPH_URL is not set');
  return new GraphQLClient(url, {
    method: 'POST',
    jsonSerializer: { parse: JSON.parse, stringify: JSON.stringify },
  });
};

export type ListedUnit = {
  id: string;
  publicId: string | null;
  description: string | null;
  /** Present for AI agents (services); absent for components and agent blueprints. */
  serviceId?: string | null;
  state?: string | null;
  tokenId?: string | null;
};

const SERVICES_QUERY = gql`
  {
    services(first: ${TOTAL_VIEW_COUNT}, orderBy: serviceId, orderDirection: desc) {
      id
      serviceId
      publicId
      description
      state
    }
  }
`;

/**
 * Components and agent blueprints are both `units`, separated by packageType — the same filters
 * the two list hooks use. `description` is requested here even though the visible table does not
 * show it, because it is the most useful text a reader gets.
 */
const COMPONENT_PACKAGE_TYPES =
  'packageType_in: [connection,skill,protocol,contract,custom,unknown]';

const unitsQuery = (where: string) => gql`
  {
    units(
      first: ${TOTAL_VIEW_COUNT}
      where: { ${where} }
      orderBy: tokenId
      orderDirection: desc
    ) {
      id
      tokenId
      publicId
      description
    }
  }
`;

/** The most recent AI agents (services), matching the list's default first page. */
export async function fetchServices(): Promise<ListedUnit[]> {
  const data = await client().request<{ services?: ListedUnit[] }>(SERVICES_QUERY);
  return data?.services ?? [];
}

/** The most recent components. */
export async function fetchComponents(): Promise<ListedUnit[]> {
  const data = await client().request<{ units?: ListedUnit[] }>(
    unitsQuery(COMPONENT_PACKAGE_TYPES),
  );
  return data?.units ?? [];
}

/** The most recent agent blueprints. */
export async function fetchAgentBlueprints(): Promise<ListedUnit[]> {
  const data = await client().request<{ units?: ListedUnit[] }>(unitsQuery('packageType: agent'));
  return data?.units ?? [];
}
