import { gql } from 'graphql-request';
import { REGISTRY_SUBGRAPH_CLIENTS } from '.';

const getService = (includeErc8004: boolean) => gql`
  query Service($id: ID!) {
    service(id: $id) {
      id
      multisig
      ${includeErc8004 ? 'erc8004Agent { id agentWallet }' : ''}
    }
  }
`;

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
  const response = await client.request<{
    service: ServiceFromRegistry;
  }>(getService(includeErc8004), { id });
  return response.service;
};
