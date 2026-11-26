import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';

import { myStakingContractAddressesKey } from 'common-util/queries/myStakingContracts';
import { useAppSelector } from 'store/index';
import { MyStakingContractsOwner, nominationKey } from 'store/launch';
import { MyStakingContract } from 'types/index';

const EMPTY: MyStakingContract[] = [];

export const getMyStakingContractsOwner = (
  chainId: number | null | undefined,
  account: string | null | undefined,
): MyStakingContractsOwner => ({
  chainId: chainId ?? null,
  account: account ? account.toLowerCase() : null,
});

const isSameOwner = (a: MyStakingContractsOwner | null, b: MyStakingContractsOwner) =>
  !!a && a.chainId === b.chainId && a.account === b.account;

/**
 * The published "my staking contracts" list, only if it belongs to the chain and account shown
 * now. Checked during render, so the first render after a chain switch, account switch or
 * disconnect already reports loading instead of the previous owner's contracts.
 *
 * Nominations confirmed in this session are applied here too, so the render right after a
 * nomination receipt never shows the contract as not nominated while the publisher catches up.
 */
export const useMyStakingContracts = () => {
  const { networkId } = useAppSelector((state) => state.network);
  const { address } = useAccount();
  const {
    isMyStakingContractsLoading,
    myStakingContracts,
    myStakingContractsOwner,
    isMyStakingContractsLookupFailed,
    confirmedNominations,
  } = useAppSelector((state) => state.launch);

  const isCurrent = isSameOwner(
    myStakingContractsOwner,
    getMyStakingContractsOwner(networkId, address),
  );

  const contracts = useMemo(() => {
    if (!isCurrent) return EMPTY;
    if (confirmedNominations.length === 0) return myStakingContracts;
    return myStakingContracts.map((contract) =>
      contract.nominationStatus !== 'nominated' &&
      confirmedNominations.includes(nominationKey(contract.chainId, contract.id))
        ? { ...contract, nominationStatus: 'nominated' as const }
        : contract,
    );
  }, [isCurrent, myStakingContracts, confirmedNominations]);

  return {
    isMyStakingContractsLoading: isMyStakingContractsLoading || !isCurrent,
    myStakingContracts: contracts,
    /** Discovery failed: an empty list is not "no contracts". Offer `useRetryMyStakingContracts`. */
    isMyStakingContractsLookupFailed: isCurrent && isMyStakingContractsLookupFailed,
  };
};

/** Looks up the current chain and account's staking contracts again, e.g. after a failure. */
export const useRetryMyStakingContracts = () => {
  const queryClient = useQueryClient();
  const { networkId } = useAppSelector((state) => state.network);
  const { address } = useAccount();
  const queryKey = useMemo(
    () => myStakingContractAddressesKey(networkId ?? undefined, address),
    [networkId, address],
  );
  const isRetrying = useIsFetching({ queryKey, exact: true }) > 0;

  const retry = useCallback(
    () => queryClient.refetchQueries({ queryKey, exact: true }),
    [queryClient, queryKey],
  );

  return { retry, isRetrying };
};
