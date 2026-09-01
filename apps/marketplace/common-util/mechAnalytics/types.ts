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

  // Mech that actually delivered. Distinct from mech_address, which is
  // the priority_mech the request was routed to; the two diverge under
  // the marketplace's non-priority delivery path. Consumers rendering
  // a "Delivered by" column MUST use this field, not mech_address.
  // NULL on undelivered rows.
  delivery_mech: string | null;

  // Token identifier the mech charged in (mech_requests.payment_type,
  // e.g. 'native' / 'usdc' / 'nvm_subscription'). Consumers pair this
  // with delivery_rate to pick correct decimals + label. NULL on the
  // pre-013 historical tail.
  payment_type: string | null;

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
