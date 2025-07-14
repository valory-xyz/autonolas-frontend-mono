import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Address } from 'viem';
import { base, mainnet } from 'viem/chains';
import { useAccount, useReadContract, useSwitchChain } from 'wagmi';

import { notifyError, notifyWarning } from '@autonolas/frontend-library';

import {
  SERVICE_REGISTRY_L2_ABI,
  SERVICE_REGISTRY_L2_ADDRESS_BASE,
} from 'common-util/AbiAndAddresses';
import { clearUserOldStakingData } from 'common-util/api';
import { updateLeaderboardUser } from 'store/setup';
import { LeaderboardUser } from 'store/types';
import { DEPRECATED_CONTRACTS_ADDRESSES } from 'util/constants';

import { restake } from './requests';

type UseRestakeParams = {
  contractAddress: Address | undefined;
};

export const useRestake = ({ contractAddress }: UseRestakeParams) => {
  const { chainId, address: account } = useAccount();
  const { switchChainAsync, switchChain } = useSwitchChain();
  const [isRestaking, setIsRestaking] = useState(false);

  const handleRestake = useCallback(async () => {
    if (!account) return;
    if (!contractAddress) return;

    if (DEPRECATED_CONTRACTS_ADDRESSES.includes(contractAddress)) {
      notifyWarning(
        'Restaking is no longer supported by this contract. Please follow the instructions to unstake and stake in a new contract.',
      );
      return;
    }

    setIsRestaking(true);

    try {
      // Switch to base
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      // Call restake
      await restake({ contractAddress, account });
    } catch (error) {
      notifyError('Error: could not restake');
      console.error(error);
    } finally {
      setIsRestaking(false);

      // Suggest the user to switch back to mainnet to avoid any
      // further errors while they interact with the app
      if (chainId !== mainnet.id) {
        switchChain({ chainId: mainnet.id });
      }
    }
  }, [account, chainId, contractAddress, switchChain, switchChainAsync]);

  return { isRestaking, handleRestake };
};

/**
 * A hook to check if the old user's service is terminated
 * meaning the user went through the recovery process from old broken staking contracts
 * and clear old values in order to not to show the alert message
 */
export const useUpdateProfileIfOldServiceTerminated = (profile?: LeaderboardUser) => {
  const dispatch = useDispatch();
  const oldStakingDataCleared = useRef(false);

  const { data: isTerminated } = useReadContract({
    address: SERVICE_REGISTRY_L2_ADDRESS_BASE,
    abi: SERVICE_REGISTRY_L2_ABI,
    chainId: base.id,
    functionName: 'getService',
    args: profile?.service_id_old ? [BigInt(profile.service_id_old)] : [BigInt(0)],
    query: {
      enabled: !!profile?.service_id_old,
      select: (data) => {
        // state == TerminatedBonded (5)
        if (data.state === 5) return true;
        return false;
      },
    },
  });

  useEffect(() => {
    if (!profile) return;
    if (oldStakingDataCleared.current) return;

    if (isTerminated) {
      clearUserOldStakingData(profile.attribute_id).then((updatedAgent) => {
        if (updatedAgent) {
          dispatch(updateLeaderboardUser(updatedAgent));
        }

        oldStakingDataCleared.current = true;
      });
    }
  }, [dispatch, isTerminated, profile]);
};
