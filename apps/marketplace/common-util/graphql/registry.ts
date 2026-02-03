import { gql } from 'graphql-request';
import { REGISTRY_SUBGRAPH_CLIENTS } from '.';

const getService = gql`
  query Service($id: ID!) {
    service(id: $id) {
      id
      erc8004Agent {
        id
        agentWallet
      }
    }
  }
`;

type ServiceFromRegistry = {
  id: string;
  erc8004Agent: {
    id: string;
    agentWallet: string | null;
  } | null;
};

type GetServiceFromRegistryParams = {
  chainId: keyof typeof REGISTRY_SUBGRAPH_CLIENTS;
  id: string;
};

export const getServiceFromRegistry = async ({ chainId, id }: GetServiceFromRegistryParams) => {
  const client = REGISTRY_SUBGRAPH_CLIENTS[chainId];
  const response = await client.request<{
    service: ServiceFromRegistry;
  }>(getService, { id });
  return response.service;
};
