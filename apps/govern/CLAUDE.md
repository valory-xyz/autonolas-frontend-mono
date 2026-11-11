# Govern app – CLAUDE.md

Guidance for working on the **Govern** app in this repo.

## Purpose

Olas governance: **voting**, **veOLAS**, **proposals**, **donations**, and **vote delegation**. Users connect a wallet to view proposals, vote, delegate voting power, and manage veOLAS (approve, lock, etc.).

## Port

**3004**

## Stack

- **Wallet**: RainbowKit (over Wagmi). See `context/Web3ModalProvider.tsx` (filename kept pending a cross-app rename), `components/Login/`, `components/Contracts/`, `components/Donate/`, `components/Proposals/`, `components/VeOlas/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `util-contracts`, `ui-theme`, `ui-components`, `util-prohibited-data`, `common-contract-functions`, `common-middleware`, `util-ssr`.

## Env / backends

- **Governor subgraph**: `NEXT_PUBLIC_GOVERNOR_SUBGRAPH_URL`
- RPCs and Wallet Project ID for RainbowKit (WalletConnect Cloud projectId — required by `getDefaultConfig`).
- **Tenderly virtual testnet** (for testing lock/vote without real ETH): set `NEXT_PUBLIC_IS_CONNECTED_TO_TEST_NET=true` and `NEXT_PUBLIC_MAINNET_TEST_RPC=<tenderly-rpc-url>` (Preview scope only). `libs/util-constants/src/lib/rpcUrls.ts` routes mainnet RPC traffic through the fork when these are set.

## Structure

- `pages/` – Next.js routes.
- `components/` – Contracts (MyVotingWeight, EditVotes, RevokePower), Donate, Proposals, Epoch, VeOlas, Login, Layout (Balance).
- `hooks/` – e.g. `useFetchBalances`, `useFetchUserVotes`, `useClaimStakingIncentivesBatch`.
- `store/`, `context/`, `common-util/` (e.g. `resetState`).

## Commands

- Serve: `yarn nx run govern:serve`
- Build: `yarn nx run govern:build`
- Test: `yarn nx test govern`
- Lint: `yarn nx lint govern`

## Staking Incentives Claiming

Staking incentives are claimed via the `Dispenser.claimStakingIncentivesBatch` contract on mainnet. The flow is:

1. `hooks/useClaimableNomineeBatches.ts` — determines which staking contracts are claimable, groups by chain ID, and creates batches (max 10 nominees per batch) with the pure `buildClaimBatches`. `refetchClaimableBatches()` re-reads the claim cursors (`mapLastClaimedStakingEpochs`) and returns the rebuilt batches with a `change` (`CursorChange`, documented on the type and on `getCursorChange`), using the confirmed claims recorded by `recordClaimedBatch`. Any change restarts the modal from the first batch (step 3 says which change retries). A failed epoch, minimum-weight, staking-inflation or weight read, including one nominee's weight missing, is reported as `claimableBatchesError` too. A failed cursor read throws on refetch and shows a load error on first load, instead of reading as already claimed.
2. `common-util/functions/staking-incentives-claim.ts` — `quoteChainClaims` / `prepareClaim`: quotes each chain, simulates the exact claim and estimates its gas before the wallet opens, so a revert from either gets the one-rebuild handling. `getUnclaimedReason` maps a mined receipt to a `ClaimError`.
   - The quote is checkpoint-aware: one Multicall3 `aggregate3` `eth_call` runs `VoteWeighting.checkpointNominee` and then `Dispenser.calculateStakingIncentives` (its `totalStakingIncentive`) for each target, in the Dispenser's own order, with each deposit processor's `getBridgingDecimals()`.
   - Value: only an Orbit chain that sends a message attaches value; the rule is documented on `quoteChainClaims`.
   - A reverting quote sub-call is reported as `QuoteCallRevertedError` (see its docstring). Reverts are found and formatted by `findInChain` / `findContractRevert` / `formatRevert` from `libs/util-functions`, shared with the marketplace.
3. `hooks/useClaimStakingIncentivesBatch.ts` — prepare → one rebuild → wallet → receipt.
   - A simulation revert re-reads the cursors (step 1). Only a `concurrent` change rebuilds once and retries the first batch; a second revert after another `concurrent` change reports `claims-changed`, or `nothing-to-claim` when nothing is left. Any other revert (e.g. `Paused`, `WrongAmount`, a processor revert) is reported as `other` with the decoded revert.
   - The claim in flight is kept in the Redux `govern` slice (`pendingClaims`, `setPendingClaim`; the states are documented on `PendingClaim`). It is cleared if nothing was sent, the receipt wait is bounded by `RECEIPT_TIMEOUT_MS`, and `clearState` keeps it.
   - While a claim is `unconfirmed` and the modal is open, the hook looks the receipt up every `PENDING_RECEIPT_POLL_MS` (the first failed lookup while the modal is open is reported through `onReceiptLookupFailed`, as a warning that the claim may still be pending); a late receipt is reported through `onLateReceipt` (claimed or not) and the list is refreshed. A hash the wallet sped up or cancelled never gets a receipt, so the modal offers Dismiss for an `unconfirmed` claim, and for a `sending` one left by an earlier modal whose wallet never answered (`canDismissPendingClaim`). A `preparing` claim is never dismissable: its run is still going and will reach the wallet.
   - A transaction that reverts, or that the wallet replaced, reports `reverted-after-simulation`; one cancelled in the wallet reports `wallet-rejected`. Neither is resent, the hash is logged, and a failed refresh afterwards is reported separately (`refresh-failed`). A failed refresh after a simulation revert is only logged, so the revert is what the user sees.
   - The raw error is logged before it is reduced to a `ClaimError`. The hook reports a `ClaimNotice`: a `ClaimError`, or one of the outcomes that are not failures (`still-pending`, `already-in-flight`, `refresh-failed`).
4. `components/Donate/ClaimStakingIncentivesModal.tsx` — UI modal that steps through batches, restarts from the first after a rebuild, and shows a message per `ClaimNotice` kind: a warning for the ones that are not failures, and a compile error for an unhandled kind.

### Arbitrum Bridge Payload (Orbit chains)

Unlike other L2 chains (which use `0x` bridge payload and zero value), chains served by `ArbitrumDepositProcessorL1` — Arbitrum One (42161) and Robinhood Chain (4663, an Arbitrum Orbit rollup) — require a proper bridge payload and ETH value for L1→L2 message passing via retryable tickets. `ORBIT_CHAIN_IDS` / `isOrbitChainId` in `common-util/functions/arbitrum-bridge.ts` is the list; `quoteChainClaims` estimates one payload per Orbit chain that sends a message.

- `common-util/functions/arbitrum-bridge.ts` — `getArbitrumBridgePayload` computes the bridge payload and the message and token costs separately using `@arbitrum/sdk` (v4, uses ethers v5 internally via `ethers-v5` alias). Robinhood Chain is not shipped by the SDK, so its core bridge contracts (bridge/inbox/outbox/rollup/sequencerInbox on mainnet) are registered lazily via `registerCustomArbitrumNetwork` before the first estimate.
- `quoteChainClaims` reads `Dispenser.mapChainIdDepositProcessors(chainId)` once per chain and passes it to the helper. A zero processor (governance has not wired the chain yet) fails the quote with an error naming the chain, which the claim modal shows.
- The bridge payload encodes parameters for `ArbitrumDepositProcessorL1._sendMessage`. Gas parameters are estimated via `@arbitrum/sdk` with 30% safety buffers.
- Contract references: [`ArbitrumDepositProcessorL1.sol`](https://github.com/valory-xyz/autonolas-tokenomics/blob/main/contracts/staking/ArbitrumDepositProcessorL1.sol), [`DefaultDepositProcessorL1.sol`](https://github.com/valory-xyz/autonolas-tokenomics/blob/main/contracts/staking/DefaultDepositProcessorL1.sol).
- Tests: `common-util/functions/arbitrum-bridge.spec.ts`, `common-util/functions/staking-incentives-claim.spec.ts`, `hooks/useClaimStakingIncentivesBatch.spec.tsx`, `hooks/useClaimableNomineeBatches.spec.ts` and `components/Donate/ClaimStakingIncentivesModal.spec.tsx`.

## Proposal deep-linking

Individual on-chain proposals are shareable via `/proposals?proposalId=<proposalId>`:

- `components/Proposals/ProposalsList.tsx` reads `query.proposalId`, expands that row, and scrolls it into view (each row is anchored with `id="proposal-<proposalId>"` via `onRow`). Note the subgraph sets entity `id === proposalId`, so the table's `rowKey="id"` matches the `expandedRowKeys` (which use `proposalId`).
- `components/Proposals/ProposalDetails.tsx` exposes a **Copy link** button that writes the absolute URL to the clipboard.
- SEO: `/proposals?proposalId=...` is a deep-link variant of `/proposals`, not a distinct page. `components/Meta.tsx` emits `<link rel="canonical">` from `pageUrl` (query-string-free), so query-param variants consolidate onto the canonical `/proposals` URL instead of being flagged as duplicate titles.

## Proposal execution ETA

A queued proposal sits in the timelock until it can be executed:

- `hooks/useProposalEta.ts` reads `GovernorOLAS.proposalEta(proposalId)` (mainnet), which returns the executable timestamp (0 when not queued). It's only enabled while a proposal is queued (`isQueued && !isExecuted && !isCancelled`).
- `components/Proposals/ProposalDetails.tsx` shows an **Executable** field for queued proposals: the full date plus the time remaining (`in 1d 2h 3m`, or `ready to execute` once the ETA has passed), formatted via `formatDuration` in `common-util/functions/time.ts`.

## Footer contracts (per tab)

`components/Layout/Footer/index.tsx` shows different contract links depending on the route: the **/proposals** page links **GovernorOLAS** + veOLAS, while the other (voting) tabs link **VoteWeighting** + veOLAS.

## Contracts page rendering (`/contracts`)

`getStaticProps` pre-renders the staking-contract table via `fetchGovernContracts()` and
revalidates every 5 minutes (ISR), so the rows ship as HTML rather than `No data`.

- **ISR, not `getServerSideProps`.** PR #350 moved this page to client-only because per-request
  SSR hung serverless workers on slow RPCs. `/epoch` already uses this pattern.
- The snapshot is passed down as a prop (`ContractsPage` -> `ContractsList`), *not* dispatched
  into Redux from a `useEffect`. An earlier attempt did the latter, which runs only after mount
  and so left the server HTML empty — the exact problem this is meant to fix.
- `ContractsList` renders `stakingContracts` from the store once populated, falling back to
  `initialContracts` before then, and suppresses the loading spinner while the snapshot is showing.
- **Never let this page render `No data`.** The table's `locale.emptyText` describes what the
  table lists instead.
- **Failure semantics matter.** `createSnapshotGetStaticProps` (in `libs/util-ssr`) rethrows when
  a *revalidation* fails, so Next keeps serving the last good page. Returning empty props instead
  looks safe but is a successful render to Next: it caches the empty result and overwrites the
  working table. Failures during the *build* are swallowed, because a throw there fails the whole
  build and there is no previous page to fall back to.
- **Published figures carry scope and an as-of time**, per the Phase 1 standard. Pre-rendered HTML
  is read long after it was generated, so a hidden (`.sr-only`) line states what the table counts
  and when the snapshot was taken. Hidden, not visible — the visible design is unchanged.
- **The ISR fetch needs a raised `maxDuration`.** `pages/contracts.tsx` exports
  `config = { maxDuration: 120 }` and the in-code timeout is 90 s. 45 s was not enough: the fan-out measured ~36 s on one run and then
  exceeded 45 s on the next, which in production means intermittently shipping the fallback
  instead of the table. Vercel's default function duration is well below this, so the platform
  would cut the fetch short without that file.
- The blob cache's storage logic lives in `libs/util-functions/src/lib/contractCacheStore.ts`,
  shared with the other app. Only the prefix, token and payload shape differ. The *data* is not
  shared: operate and govern cache different shapes (govern reads 13 contract fields, operate 6,
  and they disagree on whether `maxNumServices` is a string or a number), so sharing one store
  would need both fetchers and schemas unified first.
- **Guarded by tests, not just by review.** `*.prerender.spec.tsx` asserts the table renders rows
  from `initialContracts` and never renders a bare `No data`; both run in CI. `yarn
  check:served-text <app>` makes the same assertions against real built HTML after `nx build`.
- Keeping the fetch inside the ISR budget needed two things: the mainnet client uses
  `batch: { multicall: true }` plus `http(url, { batch: true })` (one
  `nomineeRelativeWeightWrite` eth_call per nominee, twice over, is ~100 round trips), and
  `fetchMetadataForNominees` reads the Vercel Blob cache first and writes through on a miss, the
  same two-phase path as `/api/contracts/batch`. Resolving metadata straight from chain + IPFS
  took ~70 s on its own.

## Notes

- Voting and delegation logic depends on governor contracts and subgraph; ensure correct chain and subgraph URL.
- Balance and vote displays are wallet/contract-driven.
- Quorum column: for settled/started proposals the displayed quorum equals on-chain `GovernorOLAS.quorum(startBlock)` (3% of veOLAS `getPastTotalSupply` at the snapshot block = creation + `votingDelay`, ~1.8 days). For not-yet-started proposals `hooks/useProposals.ts` shows an **approximate** value computed at the current block (prefixed `~`), identical across all pending proposals. `useBlock({ chainId: mainnet.id })` there is pinned to mainnet, so the `block.number` vs `startBlock`/`endBlock` comparisons (and the approximation) are correct regardless of the wallet's connected chain. When the on-chain quorum is unavailable (subgraph `null` and the backfill `quorum()` read returns nothing — e.g. a never-finalized legacy proposal or a transient RPC failure), `quorum` stays `null`; the column renders `0` and `isQuorumReached` treats it as not reached.
