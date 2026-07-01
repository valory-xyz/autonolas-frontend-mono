import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useReadContract } from 'wagmi';

import { GOVERNOR_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';

/**
 * Returns the timestamp (in seconds) at which a queued proposal becomes
 * executable, read from `GovernorOLAS.proposalEta(proposalId)`.
 *
 * The ETA is only meaningful while the proposal sits in the timelock queue
 * (i.e. queued but not yet executed/cancelled); `enabled` should reflect that.
 */
export const useProposalEta = (proposalId: string, enabled: boolean) => {
  const { data, isLoading, isError } = useReadContract({
    address: (GOVERNOR_OLAS.addresses as Record<number, Address>)[mainnet.id],
    abi: GOVERNOR_OLAS.abi as Abi,
    functionName: 'proposalEta',
    chainId: mainnet.id,
    args: [BigInt(proposalId)],
    query: {
      enabled,
      // Don't retry: the call either succeeds quickly or fails deterministically
      // (e.g. on a forked/preview mainnet RPC that lacks this proposal's timelock
      // state, `proposalEta` returns empty data). Retrying would leave the UI
      // stuck on a loading skeleton instead of settling to a fallback.
      retry: false,
    },
  });

  // `proposalEta` returns 0 when the proposal is not in the timelock queue.
  const eta = data ? BigInt(data as string | bigint) : undefined;

  return {
    // executable timestamp in seconds, or undefined when not queued/unavailable
    eta: eta && eta > 0n ? eta : undefined,
    isLoading,
    isError,
  };
};
