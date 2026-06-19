import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { ErrorAlert } from 'common-util/ErrorAlert';
import { URL } from 'common-util/constants/urls';
import { Feature, getErrorInfo } from 'common-util/functions/frontend-library';
import { addNominee } from 'common-util/functions/web3';
import { useAppDispatch, useAppSelector } from 'store/index';
import { setIsNominated } from 'store/launch';
import { ErrorType, MyStakingContract } from 'types/index';

import {
  ConnectWalletBeforeNominate,
  Container,
  ContractAlreadyNominated,
  ContractDoesNotExist,
  ErrorTransaction,
  Loader,
  SuccessfulTransaction,
  SwitchNetworkError,
  WaitingForTransaction,
} from './utils';

type NominatedContractContentProps = {
  contractName: string;
  contractInfo: MyStakingContract;
};

const NominatedContractContent: FC<NominatedContractContentProps> = ({
  contractName,
  contractInfo,
}) => {
  const router = useRouter();
  const { chainId, address: account } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { networkName } = useAppSelector((state) => state.network);
  const dispatch = useAppDispatch();

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

      setIsSuccessful(true);

      // Wait for 2s so the user can see success state
      setTimeout(() => {
        dispatch(setIsNominated({ id: contractInfo.id }));
        router.replace(`/${networkName}/${URL.myStakingContracts}`);
      }, 2000);
    } catch (error) {
      const errorResult = getErrorInfo(Feature.NOMINATE, error as Error);
      setError(errorResult);
    } finally {
      setIsPending(false);
    }
  }, [account, contractInfo, dispatch, networkName, router]);

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
  const { isMyStakingContractsLoading, myStakingContracts } = useAppSelector(
    (state) => state.launch,
  );

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

  // contract already nominated
  const contractAlreadyNominated = contractInfo.isNominated;
  if (contractAlreadyNominated) return <ContractAlreadyNominated contractName={contractName} />;

  return (
    <Container>
      <NominatedContractContent
        key={contractInfo.id}
        contractName={contractName}
        contractInfo={contractInfo}
      />
    </Container>
  );
};
