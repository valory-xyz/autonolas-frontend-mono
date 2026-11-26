import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { ErrorAlert } from 'common-util/ErrorAlert';
import { URL } from 'common-util/constants/urls';
import { Feature, getErrorInfo } from 'common-util/functions/frontend-library';
import { addNominee } from 'common-util/functions/web3';
import { useAppDispatch, useAppSelector } from 'store/index';
import { recordConfirmedNomination } from 'store/launch';
import { ErrorType, MyStakingContract } from 'types/index';

import { useMyStakingContracts } from 'hooks/useMyStakingContracts';
import { useNominees } from 'hooks/useNominees';

import {
  ConnectWalletBeforeNominate,
  Container,
  ContractAlreadyNominated,
  ContractDoesNotExist,
  ErrorTransaction,
  Loader,
  NominationStatusUnavailable,
  SuccessfulTransaction,
  SwitchNetworkError,
  WaitingForTransaction,
} from './utils';

type NominatedContractContentProps = {
  contractName: string;
  contractInfo: MyStakingContract;
  /** Called once the receipt succeeded, before the nomination is recorded. */
  onNominated: () => void;
};

const NominatedContractContent: FC<NominatedContractContentProps> = ({
  contractName,
  contractInfo,
  onNominated,
}) => {
  const router = useRouter();
  const { chainId, address: account } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { networkName } = useAppSelector((state) => state.network);
  const dispatch = useAppDispatch();
  const { refetch: refetchNominees } = useNominees();

  const [isFailedToSwitch, setIsFailedToSwitch] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<ErrorType>(null);

  // Guards so the auto-triggered network switch and nominate transaction each fire
  // at most once. Without these, background data refreshes (e.g. wagmi reads in
  // useGetMyStakingContracts re-dispatching myStakingContracts) recreate the
  // callbacks below, re-running the effect and enqueuing duplicate transactions
  // while a transaction is still awaiting signature.
  const hasSwitchedRef = useRef(false);
  const hasNominatedRef = useRef(false);

  const switchNetworkCallback = useCallback(async () => {
    try {
      setIsPending(true);
      await switchChainAsync({ chainId: mainnet.id });
    } catch (error) {
      setIsFailedToSwitch(true);
    } finally {
      setIsPending(false);
    }
  }, [switchChainAsync]);

  const addNomineeCallback = useCallback(async () => {
    if (!account) return;
    try {
      setIsPending(true);
      await addNominee({
        address: contractInfo.id,
        nomineeChainId: contractInfo.chainId,
        account,
      });

      // Committed before the nomination is recorded below: recording makes the contract
      // nominated, and this page must keep showing the success state rather than switch to
      // "already nominated" (which would unmount this view).
      flushSync(() => {
        setIsSuccessful(true);
        onNominated();
      });

      // The receipt succeeded (addNominee throws otherwise): record it now, so leaving this page
      // straight away shows the contract as nominated, and keep it nominated until the
      // refreshed nominee read includes it, so a lagging RPC cannot bring back "not nominated".
      dispatch(
        recordConfirmedNomination({
          chainId: contractInfo.chainId,
          address: contractInfo.id,
        }),
      );
      refetchNominees();

      // Wait for 2s so the user can see success state.
      setTimeout(() => {
        router.replace(`/${networkName}/${URL.myStakingContracts}`);
      }, 2000);
    } catch (error) {
      const errorResult = getErrorInfo(Feature.NOMINATE, error as Error);
      setError(errorResult);
    } finally {
      setIsPending(false);
    }
  }, [account, contractInfo, dispatch, networkName, onNominated, refetchNominees, router]);

  useEffect(() => {
    if (!account) return;

    if (chainId !== mainnet.id) {
      // Prompt the network switch only once; on failure we show SwitchNetworkError
      // rather than re-prompting in a loop.
      if (hasSwitchedRef.current) return;
      hasSwitchedRef.current = true;
      switchNetworkCallback();
      return;
    }

    // On mainnet: fire the nominate transaction exactly once.
    if (hasNominatedRef.current) return;
    hasNominatedRef.current = true;
    addNomineeCallback();
  }, [chainId, account, addNomineeCallback, switchNetworkCallback]);

  const transactionInfo = useMemo(() => {
    if (isFailedToSwitch) return <SwitchNetworkError />;
    if (error) return <ErrorAlert error={error} networkId={chainId} />;
    return null;
  }, [isFailedToSwitch, error, chainId]);

  if (isPending) {
    return <WaitingForTransaction contractName={contractName} />;
  }

  if (isSuccessful) {
    return <SuccessfulTransaction contractName={contractName} />;
  }

  return (
    <ErrorTransaction
      contractName={contractName}
      errorInfo={transactionInfo}
      errorTitle={error?.name}
      onRetry={isFailedToSwitch ? undefined : addNomineeCallback}
    />
  );
};

export const NominateContract = () => {
  const { address: account } = useAccount();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { networkDisplayName } = useAppSelector((state) => state.network);
  const { isMyStakingContractsLoading, myStakingContracts } = useMyStakingContracts();
  const { refetch: refetchNominees, isFetching: isNomineesFetching } = useNominees();
  // The contract this page has just nominated: it stays on the transaction view (success, then
  // redirect) although the contract now reads as nominated.
  const [nominatedId, setNominatedId] = useState<string | null>(null);

  // my contracts are still loading
  if (isMyStakingContractsLoading) return <Loader />;

  // contract list is empty
  if (!id || !myStakingContracts || myStakingContracts.length === 0) {
    return <ContractDoesNotExist />;
  }

  // contract does not exist
  const contractIndex = myStakingContracts.findIndex((item) => item.id === id);
  if (contractIndex === -1) return <ContractDoesNotExist />;

  // account is not connected
  const contractInfo = myStakingContracts[contractIndex];
  const contractName = `Contract #${contractIndex + 1} ${
    contractInfo.name
  } on ${networkDisplayName} chain`;
  if (!account) return <ConnectWalletBeforeNominate contractName={contractName} />;

  // nomination status: only a contract known not to be nominated gets the transaction
  switch (nominatedId === contractInfo.id ? 'notNominated' : contractInfo.nominationStatus) {
    case 'loading':
      return <Loader />;
    case 'unknown':
      return (
        <NominationStatusUnavailable
          contractName={contractName}
          isRetrying={isNomineesFetching}
          onRetry={() => refetchNominees()}
        />
      );
    case 'nominated':
      return <ContractAlreadyNominated contractName={contractName} />;
    case 'notNominated':
      break;
  }

  return (
    <Container>
      <NominatedContractContent
        key={contractInfo.id}
        contractName={contractName}
        contractInfo={contractInfo}
        onNominated={() => setNominatedId(contractInfo.id)}
      />
    </Container>
  );
};
