import { gql, GraphQLClient } from 'graphql-request';
import { base, gnosis, mode, optimism, polygon } from 'viem/chains';
import type { RequestConfig } from 'graphql-request/build/esm/types';

const requestConfig: RequestConfig = {
  method: 'POST',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
};

function buildStakingGraphClients(): Partial<Record<number, GraphQLClient>> {
  const clients: Partial<Record<number, GraphQLClient>> = {};
  const modeUrl = process.env.NEXT_PUBLIC_STAKING_CONTRACTS_MODE_SUBGRAPH_URL;
  const optimismUrl = process.env.NEXT_PUBLIC_STAKING_CONTRACTS_OPTIMISM_SUBGRAPH_URL;
  const gnosisUrl = process.env.NEXT_PUBLIC_STAKING_CONTRACTS_GNOSIS_SUBGRAPH_URL;
  const baseUrl = process.env.NEXT_PUBLIC_STAKING_CONTRACTS_BASE_SUBGRAPH_URL;
  const polygonUrl = process.env.NEXT_PUBLIC_STAKING_CONTRACTS_POLYGON_SUBGRAPH_URL;
  if (modeUrl) clients[mode.id] = new GraphQLClient(modeUrl, requestConfig);
  if (optimismUrl) clients[optimism.id] = new GraphQLClient(optimismUrl, requestConfig);
  if (gnosisUrl) clients[gnosis.id] = new GraphQLClient(gnosisUrl, requestConfig);
  if (baseUrl) clients[base.id] = new GraphQLClient(baseUrl, requestConfig);
  if (polygonUrl) clients[polygon.id] = new GraphQLClient(polygonUrl, requestConfig);
  return clients;
}

export const STAKING_GRAPH_CLIENTS = buildStakingGraphClients();

export type SupportedStakingChain = keyof typeof STAKING_GRAPH_CLIENTS;

export function hasSubgraphSupport(chainId: number): chainId is SupportedStakingChain {
  return chainId in STAKING_GRAPH_CLIENTS && STAKING_GRAPH_CLIENTS[chainId] != null;
}

export type SubgraphStakingContract = {
  id: string;
  maxNumServices: string;
  rewardsPerSecond: string;
  minStakingDeposit: string;
  numAgentInstances: string;
  agentIds: string[];
};

export type SubgraphCheckpoint = {
  id: string;
  contractAddress: string;
  availableRewards: string;
  blockTimestamp: string;
  epoch: string;
};

export type SubgraphStakingRow = {
  maxNumServices: number;
  filledSlots: number;
  rewardsPerSecond: string;
  minStakingDeposit: string;
  numAgentInstances: string;
  availableRewards: string;
};

type StakingContractsResponse = { stakingContracts: SubgraphStakingContract[] };
type CheckpointsResponse = { checkpoints: SubgraphCheckpoint[] };

const STAKING_CONTRACTS_QUERY = gql`
  query StakingContractsByIds($ids: [Bytes!]!) {
    stakingContracts(where: { id_in: $ids }) {
      id
      maxNumServices
      rewardsPerSecond
      minStakingDeposit
      numAgentInstances
      agentIds
    }
  }
`;

const CHECKPOINTS_QUERY = gql`
  query LatestCheckpointsByContracts($contractAddresses: [Bytes!]!) {
    checkpoints(
      where: { contractAddress_in: $contractAddresses }
      orderBy: blockTimestamp
      orderDirection: desc
      first: 500
    ) {
      id
      contractAddress
      availableRewards
      blockTimestamp
      epoch
    }
  }
`;

function normalizeAddress(addr: string): string {
  return addr.toLowerCase().startsWith('0x') ? addr.toLowerCase() : addr;
}

/**
 * Fetch staking contracts and latest checkpoints from subgraph for the given chain and addresses.
 * Returns a map of account (bytes32 / address key) -> SubgraphStakingRow for use in the contracts list.
 */
export async function fetchStakingDataFromSubgraph(
  chainId: number,
  addresses: string[],
): Promise<Map<string, SubgraphStakingRow>> {
  if (!hasSubgraphSupport(chainId) || addresses.length === 0) {
    return new Map();
  }

  const client: GraphQLClient | undefined = STAKING_GRAPH_CLIENTS[chainId];
  if (!client) return new Map();

  const ids = addresses.map(normalizeAddress);

  const [contractsRes, checkpointsRes] = await Promise.all([
    client.request<StakingContractsResponse>(STAKING_CONTRACTS_QUERY, { ids }),
    client.request<CheckpointsResponse>(CHECKPOINTS_QUERY, {
      contractAddresses: ids,
    }),
  ]);

  const contracts = contractsRes.stakingContracts ?? [];
  const checkpoints = checkpointsRes.checkpoints ?? [];

  const latestCheckpointByContract = new Map<string, SubgraphCheckpoint>();
  for (const cp of checkpoints) {
    const key = normalizeAddress(cp.contractAddress);
    if (!latestCheckpointByContract.has(key)) {
      latestCheckpointByContract.set(key, cp);
    }
  }

  const result = new Map<string, SubgraphStakingRow>();
  for (const c of contracts) {
    const key = normalizeAddress(c.id);
    const checkpoint = latestCheckpointByContract.get(key);
    result.set(key, {
      maxNumServices: Number(c.maxNumServices),
      filledSlots: (c.agentIds ?? []).length,
      rewardsPerSecond: c.rewardsPerSecond,
      minStakingDeposit: c.minStakingDeposit,
      numAgentInstances: c.numAgentInstances,
      availableRewards: checkpoint?.availableRewards ?? '0',
    });
  }

  return result;
}
