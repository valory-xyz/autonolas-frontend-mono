import { ContributeModuleDetails } from 'types/moduleDetails';
import { ContributeTweet } from 'types/tweets';
import { ContributeAgent } from 'types/users';

export type LeaderboardUser = ContributeAgent['json_value'] & {
  rank: number;
};

export type Tweet = ContributeTweet['json_value'];

export type ModuleDetails = ContributeModuleDetails['json_value'];

export type StateDetails = {
  details: { profile: { username: string }; metadata: { address: string } };
  status: number;
};
