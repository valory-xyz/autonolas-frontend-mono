import { gql, GraphQLClient } from 'graphql-request';
import { STAKING_GRAPH_CLIENTS } from './index';

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
  chain: keyof typeof STAKING_GRAPH_CLIENTS;
  senderId: string;
};

export async function getStakingContractsBySender({
  chain,
  senderId,
}: GetStakingContractsParams): Promise<StakingContractsResponse> {
  const client: GraphQLClient | undefined = STAKING_GRAPH_CLIENTS[chain];

  if (!client) {
    throw new Error(`Unsupported subgraph chain: ${chain}`);
  }

  return client.request(
    gql`
      query StakingContractsBySender($sender: Bytes!) {
        stakingContracts(where: { sender: $sender }) {
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
        }
      }
    `,
    {
      sender: senderId.toLowerCase(),
    },
  );
}

/**
 * Check if a chain ID has subgraph support
 */
export function hasSubgraphSupport(chainId: number): chainId is keyof typeof STAKING_GRAPH_CLIENTS {
  return chainId in STAKING_GRAPH_CLIENTS;
}
