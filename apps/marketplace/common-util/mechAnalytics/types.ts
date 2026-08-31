export type MechAnalyticsSourceLabel = 'mech_onchain' | 'mech_offchain' | 'ipfs_historical';

export interface ScoredRow {
  request_id: string;
  tool: string;
  mech_address: string;
  requester: string;
  chain_id: number;

  market_id: string | null;
  question_title: string | null;

  requested_at: string;
  delivered_at: string;
  computed_at: string;

  source: MechAnalyticsSourceLabel | string | null;

  request_ipfs_hash: string | null;
  delivery_ipfs_hash: string | null;
  request_tx_hash: string | null;
  delivery_tx_hash: string | null;

  // Decimal-string on the wire — parse with BigInt, not Number.
  // Native-currency values (18 decimals) overflow float53 above 0.01 xDAI.
  delivery_rate: string | null;

  // Wrap CIDs in a gateway <a href> only when true.
  // Off-chain CIDs live in a private lake; a public gateway would 404.
  ipfs_retrievable: boolean;
}

export interface ScoredRowsResponse {
  rows: ScoredRow[];
  next_cursor: string | null;
}

export interface RequesterMetricsWindow {
  n_mech_requests: number;
  n_mech_deliveries: number;
}

export interface RequesterMetricsResponse {
  requester: string;
  chain_id: number;
  windows: {
    all: RequesterMetricsWindow;
  };
}
