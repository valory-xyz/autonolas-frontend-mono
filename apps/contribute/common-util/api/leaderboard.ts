import { LeaderboardUser } from 'store/types';
import { ContributeAgent } from 'types/users';

export const getLeaderboardList = async () => {
  const response = await fetch('/api/leaderboard');
  const json: ContributeAgent[] = await response.json();
  const usersList: LeaderboardUser[] = [];

  // TODO: consider filtering and convenient mapping
  // right inside the api endpoint
  if (json && Array.isArray(json)) {
    json.forEach((user) => {
      if (!user.json_value.wallet_address) return;
      if (user.json_value.points === 0) return;
      usersList.push({
        ...user.json_value,
        rank: null,
        attribute_id: user.attribute_id,
      });
    });
  }

  return usersList;
};

type UpdateUserStakingDataParams = {
  attributeId: number;
  multisig: string;
  serviceId: number;
};

export const updateUserStakingData = async ({
  attributeId,
  multisig,
  serviceId,
}: UpdateUserStakingDataParams): Promise<ContributeAgent> => {
  const response = await fetch('/api/agent-staking', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributeId, service_multisig: multisig, service_id: serviceId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update staking data: ${response.statusText}`);
  }

  const agent: ContributeAgent = await response.json();
  return agent;
};

export const clearUserOldStakingData = async (attributeId: number) => {
  const response = await fetch('/api/agent-staking', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributeId, service_multisig_old: null, service_id_old: null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to clear staking data: ${response.statusText}`);
  }

  const agent: ContributeAgent = await response.json();
  return agent;
};
