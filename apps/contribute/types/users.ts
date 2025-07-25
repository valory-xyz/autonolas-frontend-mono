import { Address } from 'viem';

export type ContributeAgent = {
  agent_id: number;
  attr_def_id: number;
  string_value: null;
  integer_value: null;
  float_value: null;
  boolean_value: null;
  date_value: null;
  attribute_id: number;
  last_updated: string;
  json_value: {
    id: number;
    points: number;
    tweets: number[];
    token_id: string | null;
    discord_id: string | null;
    service_id: string | null;
    twitter_id: string | null;
    discord_handle: string | null;
    twitter_handle: string | null;
    wallet_address: Address;
    service_multisig: string | null;
    current_period_points: number;
    service_id_old: string | null; // old broken service id
    service_multisig_old: string | null; // old broken multisig id
    attribute_instance_id: null;
  };
};
