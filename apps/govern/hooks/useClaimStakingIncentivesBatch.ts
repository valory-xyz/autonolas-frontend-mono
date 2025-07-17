import { DISPENSER } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useWriteContract } from 'wagmi';

type ClaimStakingIncentivesBatchProps = {
  onSuccess: () => void;
  onError: (error: Error) => void;
};

export const useClaimStakingIncentivesBatch = ({
  onSuccess,
  onError,
}: ClaimStakingIncentivesBatchProps) => {
  const { writeContract, isPending } = useWriteContract();

  const claimIncentivesForBatch = async (batch: [number[], Address[][]]) => {
    const [chainIds, stakingTargets] = batch;

    // Create bridge payloads - empty for now as they're not needed for claiming
    const bridgePayloads = chainIds.map(() => '0x' as `0x${string}`);

    // Create value amounts - zero for all chains
    const valueAmounts = chainIds.map(() => BigInt(0));

    return writeContract(
      {
        address: DISPENSER.addresses[mainnet.id],
        abi: DISPENSER.abi,
        chainId: mainnet.id,
        functionName: 'claimStakingIncentivesBatch',
        args: [
          BigInt(1), // numClaimedEpochs
          chainIds.map((id) => BigInt(id)),
          stakingTargets,
          bridgePayloads,
          valueAmounts,
        ],
      },
      { onSuccess, onError },
    );
  };

  return { claimIncentivesForBatch, isPending };
};
