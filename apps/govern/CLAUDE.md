# Govern app – CLAUDE.md

Guidance for working on the **Govern** app in this repo.

## Purpose

Olas governance: **voting**, **veOLAS**, **proposals**, **donations**, and **vote delegation**. Users connect a wallet to view proposals, vote, delegate voting power, and manage veOLAS (approve, lock, etc.).

## Port

**3004**

## Stack

- **Wallet**: Web3Modal (Wagmi). See `context/Web3ModalProvider.tsx`, `components/Login/`, `components/Contracts/`, `components/Donate/`, `components/Proposals/`, `components/VeOlas/`.
- **State**: Redux (`store/`).
- **Key libs**: `util-constants`, `util-functions`, `util-contracts`, `ui-theme`, `ui-components`, `util-prohibited-data`, `common-contract-functions`, `common-middleware`, `util-ssr`.

## Env / backends

- **Governor subgraph**: `NEXT_PUBLIC_GOVERNOR_SUBGRAPH_URL`
- RPCs and Wallet Project ID for Web3Modal.

## Structure

- `pages/` – Next.js routes.
- `components/` – Contracts (MyVotingWeight, EditVotes, RevokePower), Donate, Proposals, Epoch, VeOlas, Login, Layout (Balance).
- `hooks/` – e.g. `useFetchBalances`, `useFetchUserVotes`, `useClaimStakingIncentivesBatch`, `useArbitrumBridgePayload`.
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

- `hooks/useArbitrumBridgePayload.ts` — computes the bridge payload and ETH cost using `@arbitrum/sdk` (v4, uses ethers v5 internally via `ethers-v5` alias).
- The bridge payload encodes 5 values for `ArbitrumDepositProcessorL1._sendMessage`: `(refundAccount, gasPriceBid, maxSubmissionCostToken, gasLimitMessage, maxSubmissionCostMessage)` — exactly 160 bytes.
- Gas parameters are estimated via `ParentToChildMessageGasEstimator.estimateAll()` and `estimateSubmissionFee()` with 30% safety buffers.
- The deposit processor address is read on-chain from `Dispenser.mapChainIdDepositProcessors(42161)`, and `l2TargetDispenser` is read from the deposit processor.
- Total ETH cost = token transfer cost (`maxSubmissionCostToken + TOKEN_GAS_LIMIT * gasPriceBid`) + message cost (`maxSubmissionCostMessage + gasLimitMessage * gasPriceBid`). Excess is refunded on L2.
- Contract references: [`ArbitrumDepositProcessorL1.sol`](https://github.com/valory-xyz/autonolas-tokenomics/blob/main/contracts/staking/ArbitrumDepositProcessorL1.sol), [`DefaultDepositProcessorL1.sol`](https://github.com/valory-xyz/autonolas-tokenomics/blob/main/contracts/staking/DefaultDepositProcessorL1.sol).
- Tests: `hooks/useArbitrumBridgePayload.spec.ts` and `hooks/useClaimStakingIncentivesBatch.spec.ts` cover payload encoding, cost calculation, mixed-chain batches, and error propagation.

## Notes

- Voting and delegation logic depends on governor contracts and subgraph; ensure correct chain and subgraph URL.
- Balance and vote displays are wallet/contract-driven.
