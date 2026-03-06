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

export const STAKING_GRAPH_CLIENTS = {
  [mode.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_MODE_SUBGRAPH_URL!,
    requestConfig,
  ),
  [optimism.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_OPTIMISM_SUBGRAPH_URL!,
    requestConfig,
  ),
  [gnosis.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_GNOSIS_SUBGRAPH_URL!,
    requestConfig,
  ),
  [base.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_BASE_SUBGRAPH_URL!,
    requestConfig,
  ),
  [polygon.id]: new GraphQLClient(
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS_POLYGON_SUBGRAPH_URL!,
    requestConfig,
  ),
} as const;

export type SupportedStakingChain = keyof typeof STAKING_GRAPH_CLIENTS;

export function hasSubgraphSupport(chainId: number): chainId is SupportedStakingChain {
  return (
    chainId in STAKING_GRAPH_CLIENTS &&
    STAKING_GRAPH_CLIENTS[chainId as keyof typeof STAKING_GRAPH_CLIENTS] != null
  );
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

const CHECKPOINTS_CHUNK_SIZE = 10;

function buildLatestCheckpointsChunkQuery(count: number): string {
  const fields = 'id contractAddress availableRewards blockTimestamp epoch';
  const aliases = Array.from(
    { length: count },
    (_, i) =>
      `cp${i}: checkpoints(where: { contractAddress: $addr${i} }, orderBy: blockTimestamp, orderDirection: desc, first: 1) { ${fields} }`,
  ).join(' ');
  const vars = Array.from({ length: count }, (_, i) => `$addr${i}: Bytes!`).join(' ');
  return `query LatestCheckpointsChunk(${vars}) { ${aliases} }`;
}

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

  const client = STAKING_GRAPH_CLIENTS[chainId as keyof typeof STAKING_GRAPH_CLIENTS];
  if (!client) return new Map();

  const ids = addresses.map(normalizeAddress);

  const contractsRes = await client.request<StakingContractsResponse>(STAKING_CONTRACTS_QUERY, {
    ids,
  });
  const contracts = contractsRes.stakingContracts ?? [];

  // Fetch latest checkpoint per contract in chunks (aliased subqueries) so inactive contracts
  // are not skipped when active ones have many checkpoints.
  const latestCheckpointByContract = new Map<string, SubgraphCheckpoint>();
  type ChunkResponse = Record<string, SubgraphCheckpoint[]>;
  const chunkPromises: Promise<{ chunk: string[]; chunkRes: ChunkResponse }>[] = [];
  for (let i = 0; i < ids.length; i += CHECKPOINTS_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHECKPOINTS_CHUNK_SIZE);
    const variables: Record<string, string> = {};
    chunk.forEach((addr, j) => {
      variables[`addr${j}`] = addr;
    });
    const query = buildLatestCheckpointsChunkQuery(chunk.length);
    chunkPromises.push(
      client.request<ChunkResponse>(query, variables).then((chunkRes) => ({ chunk, chunkRes })),
    );
  }
  const chunkResults = await Promise.all(chunkPromises);
  for (const { chunk, chunkRes } of chunkResults) {
    chunk.forEach((addr, j) => {
      const list = chunkRes[`cp${j}`];
      const cp = Array.isArray(list) && list.length > 0 ? list[0] : null;
      if (cp) {
        latestCheckpointByContract.set(normalizeAddress(addr), cp);
      }
    });
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
