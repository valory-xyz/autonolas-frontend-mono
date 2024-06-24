import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { ErrorAlert } from 'common-util/ErrorAlert';
import { URL } from 'common-util/constants/urls';
import { Feature, addNominee, getErrorInfo } from 'common-util/functions';
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
      await addNominee({ address: contractInfo.id, chainId: contractInfo.chainId, account });

      setIsSuccessful(true);
      dispatch(setIsNominated({ id: contractInfo.id }));
      router.replace(`/${networkName}/${URL.myStakingContracts}`);
    } catch (error) {
      const errorResult = getErrorInfo(Feature.NOMINATE, error as Error);
      setError(errorResult);
    } finally {
      setIsPending(false);
    }
  }, [account, contractInfo]);

  useEffect(() => {
    if (chainId !== mainnet.id) {
      switchNetworkCallback();
    } else {
      addNomineeCallback();
    }
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
        contractName={contractName}
        contractInfo={myStakingContracts[contractIndex]}
      />
    </Container>
  );
};
