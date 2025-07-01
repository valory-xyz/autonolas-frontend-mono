import { ContributeAgent } from 'types/users';

export type LeaderboardUser = ContributeAgent['json_value'] & {
  rank: number;
};

export type StateDetails = {
  details: { profile: { username: string }; metadata: { address: string } };
  status: number;
};
