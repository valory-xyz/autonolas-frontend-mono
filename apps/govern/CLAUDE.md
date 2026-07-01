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

1. `hooks/useClaimableNomineeBatches.ts` — determines which staking contracts are claimable, groups by chain ID, and creates batches (max 10 nominees per batch).
2. `hooks/useClaimStakingIncentivesBatch.ts` — executes the on-chain claim transaction for a batch.
3. `components/Donate/ClaimStakingIncentivesModal.tsx` — UI modal that steps through batches.

### Arbitrum Bridge Payload

Unlike other L2 chains (which use `0x` bridge payload and zero value), Arbitrum (chain 42161) requires a proper bridge payload and ETH value for L1→L2 message passing via retryable tickets.

- `common-util/functions/arbitrum-bridge.ts` — computes the bridge payload and ETH cost using `@arbitrum/sdk` (v4, uses ethers v5 internally via `ethers-v5` alias).
- The bridge payload encodes parameters for `ArbitrumDepositProcessorL1._sendMessage`. Gas parameters are estimated via `@arbitrum/sdk` with 30% safety buffers.
- Contract references: [`ArbitrumDepositProcessorL1.sol`](https://github.com/valory-xyz/autonolas-tokenomics/blob/main/contracts/staking/ArbitrumDepositProcessorL1.sol), [`DefaultDepositProcessorL1.sol`](https://github.com/valory-xyz/autonolas-tokenomics/blob/main/contracts/staking/DefaultDepositProcessorL1.sol).
- Tests: `common-util/functions/arbitrum-bridge.spec.ts` and `hooks/useClaimStakingIncentivesBatch.spec.ts`.

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

## Notes

- Voting and delegation logic depends on governor contracts and subgraph; ensure correct chain and subgraph URL.
- Balance and vote displays are wallet/contract-driven.
- Quorum column: for settled/started proposals the displayed quorum equals on-chain `GovernorOLAS.quorum(startBlock)` (3% of veOLAS `getPastTotalSupply` at the snapshot block = creation + `votingDelay`, ~1.8 days). For not-yet-started proposals `hooks/useProposals.ts` shows an **approximate** value computed at the current block (prefixed `~`), identical across all pending proposals. `useBlock()` there is not pinned to `mainnet.id`, so status/approximation can be wrong if the wallet is on a non-mainnet chain.
