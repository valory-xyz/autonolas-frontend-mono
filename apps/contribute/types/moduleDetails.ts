import type { Address } from 'viem';

type Twitter = {
  current_period: string;
  latest_hashtag_tweet_id: string;
  latest_mention_tweet_id: string;
  last_tweet_pull_window_reset: number;
  number_of_tweets_pulled_today: number;
};

type Proposer = {
  address: Address;
  signature: string;
  verified: boolean;
};

type Voter = {
  address: Address;
  signature: string;
  votingPower: number;
};

type ExecutionAttempt = {
  id: string;
  verified: boolean | null;
  dateCreated: number;
};

// Currently only one type
type CampaignStatus = 'live';

type Campaign = {
  id: string;
  start_ts: number;
  end_ts: number;
  status: CampaignStatus;
  voters: Voter[];
  hashtag: string;
  proposer: Proposer;
};

export type ScheduledTweet = {
  // Could be a tweet or thread
  text: string | string[];
  posted: boolean;
  voters: Voter[];
  proposer: Proposer;
  action_id: string;
  request_id: string;
  createdDate: number;
  executionAttempts: ExecutionAttempt[];
  media_hashes: string[];
};

export type ContributeModuleDetails = {
  agent_id: number;
  attr_def_id: number;
  string_value: null;
  integer_value: null;
  float_value: null;
  boolean_value: null;
  date_value: null;
  json_value: {
    scheduled_tweet: {
      tweets: ScheduledTweet[];
    };
    twitter_campaigns: {
      campaigns: Campaign[];
    };
    dynamic_nft: {
      last_parsed_block: number;
    };
    twitter: Twitter;
    attribute_instance_id: null;
  };
  attribute_id: number;
  last_updated: string;
};
