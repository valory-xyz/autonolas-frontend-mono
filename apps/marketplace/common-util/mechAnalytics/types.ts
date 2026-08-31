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

  source: MechAnalyticsSourceLabel | null;

  request_ipfs_hash: string | null;
  delivery_ipfs_hash: string | null;
  request_tx_hash: string | null;
  delivery_tx_hash: string | null;

  // Decimal string; parse with BigInt, not Number.
  delivery_rate: string | null;

  // Wrap CIDs in a gateway <a href> only when true.
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
