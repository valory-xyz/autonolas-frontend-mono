export type ContributeTweet = {
  agent_id: 1;
  attr_def_id: 1;
  string_value: null;
  integer_value: null;
  float_value: null;
  boolean_value: null;
  date_value: null;
  json_value: {
    tweet_id: string;
    twitter_user_id: string;
    epoch: number | null;
    points: number;
    campaign: string | null;
    timestamp: number | null;
    counted_for_activity: boolean;
    attribute_instance_id: null;
  };
};
