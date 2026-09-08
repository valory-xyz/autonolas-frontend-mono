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

const UNITS_QUERY = (collection: string) => gql`
  {
    ${collection}(first: ${TOTAL_VIEW_COUNT}, orderBy: tokenId, orderDirection: desc) {
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
  const data = await client().request<{ units?: ListedUnit[] }>(UNITS_QUERY('units'));
  return data?.units ?? [];
}
