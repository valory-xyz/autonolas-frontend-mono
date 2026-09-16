import { gql } from 'graphql-request';
import { REGISTRY_SUBGRAPH_CLIENTS } from '.';
import { getSubgraphDialect, type SubgraphDialect } from './dialect';

const erc8004Fields = (includeErc8004: boolean) =>
  includeErc8004 ? 'erc8004Agent { id agentWallet }' : '';

/** The Graph: `service(id: ID!)`. */
const getServiceGraph = (includeErc8004: boolean) => gql`
  query Service($id: ID!) {
    service(id: $id) {
      id
      multisig
      ${erc8004Fields(includeErc8004)}
    }
  }
`;

/** OpenReader (squid): the by-id lookup is `serviceById(id: String!)`. */
const getServiceSquid = (includeErc8004: boolean) => gql`
  query Service($id: String!) {
    serviceById(id: $id) {
      id
      multisig
      ${erc8004Fields(includeErc8004)}
    }
  }
`;

export const getServiceQuery = (includeErc8004: boolean, dialect: SubgraphDialect) =>
  dialect === 'squid' ? getServiceSquid(includeErc8004) : getServiceGraph(includeErc8004);

type ServiceFromRegistry = {
  id: string;
  multisig: string | null;
  erc8004Agent?: {
    id: string;
    agentWallet: string | null;
  } | null;
};

type GetServiceFromRegistryParams = {
  chainId: keyof typeof REGISTRY_SUBGRAPH_CLIENTS;
  id: string;
  includeErc8004?: boolean;
};

export const getServiceFromRegistry = async ({
  chainId,
  id,
  includeErc8004 = true,
}: GetServiceFromRegistryParams) => {
  const client = REGISTRY_SUBGRAPH_CLIENTS[chainId];
  const dialect = getSubgraphDialect(chainId);
  const response = await client.request<{
    service?: ServiceFromRegistry | null;
    serviceById?: ServiceFromRegistry | null;
  }>(getServiceQuery(includeErc8004, dialect), { id });
  return (dialect === 'squid' ? response.serviceById : response.service) ?? null;
};
