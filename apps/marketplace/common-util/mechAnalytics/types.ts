export type MechAnalyticsSourceLabel = 'mech_onchain' | 'mech_offchain' | 'ipfs_historical';

export interface ScoredRow {
  request_id: string;
  // `null` on rows from /v1/data/unscored-rows (predict-api couldn't
  // parse the payload) and empty string on some historical shell rows.
  tool: string | null;
  mech_address: string;
  requester: string;
  chain_id: number;

  market_id: string | null;
  question_title: string | null;

  requested_at: string;
  // `null` on unscored rows the mech never delivered.
  delivered_at: string | null;
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
  tool_accuracy: number | null;
}

export interface RequesterMetricsResponse {
  address: string;
  chain_id: number;
  windows: {
    all: RequesterMetricsWindow;
  };
}
