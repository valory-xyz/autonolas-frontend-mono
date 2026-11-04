import { gql, GraphQLClient } from 'graphql-request';
import { STAKING_GRAPH_CLIENTS, STAKING_SQUID_CHAIN_IDS } from './index';

export type SupportedStakingChain = keyof typeof STAKING_GRAPH_CLIENTS;

export type StakingContractData = {
  id: string;
  sender: string;
  instance: string;
  implementation: string;
  metadataHash: string;
  maxNumServices: string;
  rewardsPerSecond: string;
  minStakingDeposit: string;
  minStakingDuration: string;
  maxNumInactivityPeriods: string;
  livenessPeriod: string;
  timeForEmissions: string;
  numAgentInstances: string;
  agentIds: string[];
  threshold: string;
  configHash: string;
  proxyHash: string;
  serviceRegistry: string;
  activityChecker: string;
};

export type StakingContractsResponse = {
  stakingContracts: StakingContractData[];
};

type GetStakingContractsParams = {
  chain: SupportedStakingChain;
  senderId: string;
};

const STAKING_CONTRACT_FIELDS = `
  id
  sender
  instance
  implementation
  metadataHash
  maxNumServices
  rewardsPerSecond
  minStakingDeposit
  minStakingDuration
  maxNumInactivityPeriods
  livenessPeriod
  timeForEmissions
  numAgentInstances
  agentIds
  threshold
  configHash
  proxyHash
  serviceRegistry
  activityChecker
`;

const STAKING_CONTRACTS_BY_SENDER_QUERY = gql`
  query StakingContractsBySender($sender: Bytes!) {
    stakingContracts(where: { sender: $sender }) {
      ${STAKING_CONTRACT_FIELDS}
    }
  }
`;

// id_ASC is the Graph's default order; the squid has none, and the list is shown in this order.
const STAKING_CONTRACTS_BY_SENDER_SQUID_QUERY = gql`
  query StakingContractsBySender($sender: String!) {
    stakingContracts(where: { sender_eq: $sender }, orderBy: id_ASC) {
      ${STAKING_CONTRACT_FIELDS}
    }
  }
`;

export async function getStakingContractsBySender({
  chain,
  senderId,
}: GetStakingContractsParams): Promise<StakingContractsResponse> {
  const client: GraphQLClient | undefined = STAKING_GRAPH_CLIENTS[chain];

  if (!client) {
    throw new Error(`Unsupported subgraph chain: ${chain}`);
  }

  return client.request(
    STAKING_SQUID_CHAIN_IDS.includes(chain)
      ? STAKING_CONTRACTS_BY_SENDER_SQUID_QUERY
      : STAKING_CONTRACTS_BY_SENDER_QUERY,
    {
      sender: senderId.toLowerCase(),
    },
  );
}

/**
 * Check if a chain ID has subgraph support
 */
export function hasSubgraphSupport(chainId: number): chainId is SupportedStakingChain {
  return chainId in STAKING_GRAPH_CLIENTS;
}
