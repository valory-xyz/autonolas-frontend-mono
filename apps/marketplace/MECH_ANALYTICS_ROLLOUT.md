# Marketplace-app: mech-analytics rollout

The activity feed on service pages used to read per-request entities
from the marketplace subgraph. After the off-chain marketplace
migration those entities disappear for off-chain traffic and the view
goes blank. This app now consumes mech-analytics's `/v1/data/scored-rows`
behind a feature flag so we can flip the read path per environment.

## Flag

`NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS=true` switches the read path over
for supported chains. Exact string `"true"` only — `"True"` / `"1"`
stay off.

Also required: `NEXT_PUBLIC_MECH_ANALYTICS_URL` pointed at the
mech-analytics API base (e.g. `https://mech-analytics.autonolas.tech`).
Both env vars are read lazily so a config change picks up on the next
request without a rebuild.

Off = subgraph path unchanged. Rollback is flipping the env var.

## Chain support

Optimism (10), Gnosis (100), Polygon (137), Base (8453). Matches
mech-analytics's `etl/agents.py:SUPPORTED_CHAINS`. Any other chain
falls back to the subgraph in the same request even when the flag is
on — no config change needed to keep unsupported chains working.

## Fields the API adds

Every activity row gets three fields from the mech-analytics reader
that the subgraph reader leaves undefined:

- `source` — predict-api ingest label (`mech_onchain` / `mech_offchain`
  / `ipfs_historical`). Do not switch on it directly; read
  `ipfsRetrievable` instead.
- `ipfsRetrievable: boolean` — server-side flag from
  `ScoredRow.ipfs_retrievable`. Whether the CID resolves on a public
  IPFS gateway. Off-chain CIDs live in a private lake and would 404;
  render the hash as plain text and wrap in `<a href>` only when this
  is `true`.
- `deliveryRate: string | null` — decimal string in the payment token's
  smallest unit. Parse with `BigInt` / `ethers.BigNumber` — native-currency
  values overflow `Number.MAX_SAFE_INTEGER` at 0.01 xDAI.

## Rendering rules

- **IPFS cells** always show the CID as text when populated; only the
  gateway link is gated on `ipfsRetrievable`. Done via
  `<AddressLink … isIpfs canNotClick={activity.ipfsRetrievable === false} />`.
- **Tx cells** already tolerate null via existing `NA` fallback.
- **Missing fields** on rows from the subgraph path stay undefined; the
  render sites treat `undefined` the same as `true` (retrievable), so
  the existing behaviour is preserved for flag-off consumers.

## What the flag affects

- `pages/api/service-activity.ts` — reads from mech-analytics per
  multisig when supported, otherwise the subgraph.
- `pages/api/services.ts` / `common-util/graphql/services.ts` — demand-side
  `totalRequests` sums per-multisig `n_mech_requests` from mech-analytics
  when the flag is on; falls back to `Sender.totalLegacyRequests` from
  the subgraph otherwise. `totalDeliveries` stays on the subgraph
  (`Mech.totalDeliveriesTransactions`) either way.
- Render sites in `common-util/Details/` gate the IPFS gateway link on
  `activity.ipfsRetrievable`.

## Rollback

Flip `NEXT_PUBLIC_USE_MECH_ANALYTICS_ROWS` off (unset or any value !==
`"true"`). Both API routes revert to their subgraph path on the next
request. No cache invalidation required — the routes carry their own
`Cache-Control`.
