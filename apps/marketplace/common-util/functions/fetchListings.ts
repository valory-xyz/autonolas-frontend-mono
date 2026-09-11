import { gql } from 'graphql-request';

import { REGISTRY_GRAPHQL_CLIENT } from 'common-util/graphql';
import { TOTAL_VIEW_COUNT } from 'util/constants';

/**
 * Server-side reads of the registry subgraph for the listing pages. The queries mirror the ones
 * in each list's hooks — if those change, change these too.
 */

export type ListedUnit = {
  id: string;
  publicId: string | null;
  description: string | null;
  /** Present for AI agents (services); absent for components and agent blueprints. */
  serviceId?: string | null;
  state?: string | null;
  tokenId?: string | null;
};

/** Shared with the list hooks, so the pre-rendered first page and the live table agree. */
export const SERVICES_ORDER = 'orderBy: serviceId, orderDirection: desc';
export const COMPONENT_PACKAGE_TYPES =
  'packageType_in: [connection,skill,protocol,contract,custom,unknown]';

const SERVICES_QUERY = gql`
  {
    services(first: ${TOTAL_VIEW_COUNT}, ${SERVICES_ORDER}) {
      id
      serviceId
      publicId
      description
      state
    }
  }
`;

/** Components and agent blueprints are both `units`, split by packageType. `description` is the most useful text a reader gets. */
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
  const data = await REGISTRY_GRAPHQL_CLIENT.request<{ services?: ListedUnit[] }>(SERVICES_QUERY);
  return data?.services ?? [];
}

/** The most recent components. */
export async function fetchComponents(): Promise<ListedUnit[]> {
  const data = await REGISTRY_GRAPHQL_CLIENT.request<{ units?: ListedUnit[] }>(
    unitsQuery(COMPONENT_PACKAGE_TYPES),
  );
  return data?.units ?? [];
}

/** The most recent agent blueprints. */
export async function fetchAgentBlueprints(): Promise<ListedUnit[]> {
  const data = await REGISTRY_GRAPHQL_CLIENT.request<{ units?: ListedUnit[] }>(
    unitsQuery('packageType: agent'),
  );
  return data?.units ?? [];
}
