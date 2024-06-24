import { useParams } from 'next/navigation';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { ErrorAlert } from 'common-util/ErrorAlert';
import { addNominee, getErrorInfo } from 'common-util/functions';
import { useAppSelector } from 'store/index';
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
  const { chainId, address: account } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [isFailedToSwitch, setIsFailedToSwitch] = useState(false);
  const [error, setError] = useState<ErrorType>(null);

  const switchNetworkCallback = useCallback(async () => {
    try {
      const result = await switchChainAsync({ chainId: mainnet.id });
      console.log('result', result);
    } catch (error) {
      console.log('error', error);
      setIsFailedToSwitch(true);
    }
  }, [switchChainAsync]);

  const addNomineeCallback = useCallback(async () => {
    if (!account) return;
    try {
      await addNominee({ address: contractInfo.id, chainId: contractInfo.chainId, account });
    } catch (error) {
      const errorResult = getErrorInfo('nominate', error as Error);
      setError(errorResult);
    }
  }, [account, contractInfo]);

  useEffect(() => {
    (async () => {
      if (chainId !== mainnet.id) {
        switchNetworkCallback();
      } else {
        addNomineeCallback();
      }
    })();
  }, [chainId, addNomineeCallback, switchNetworkCallback]);

  const transactionInfo = useMemo(() => {
    if (isFailedToSwitch) return <SwitchNetworkError />;
    if (error) return <ErrorAlert error={error} networkId={chainId} />;
    return null;
  }, [isFailedToSwitch, error, chainId]);

  // TODO: check for is successful
  const isPending = true;
  const isSuccessful = false;

  if (isPending) {
    return <WaitingForTransaction contractName={contractName} />;
  }

  if (isSuccessful) {
    return <SuccessfulTransaction contractName={contractName} />;
  }

  return <ErrorTransaction contractName={contractName} errorInfo={transactionInfo} />;
};

export const NominateContract = () => {
  const { address: account } = useAccount();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { networkDisplayName } = useAppSelector((state) => state.network);
  const { isMyStakingContractsLoading, myStakingContracts } = useAppSelector(
    (state) => state.launch,
  );

  // contract does not exist
  const contractIndex = myStakingContracts.findIndex((item) => item.id === id);
  if (contractIndex === -1) return <ContractDoesNotExist />;

  // account is not connected
  const contractInfo = myStakingContracts[contractIndex];
  const contractName = ` #${contractIndex + 1} ${contractInfo.name} on ${networkDisplayName} chain`;
  if (!account) return <ConnectWalletBeforeNominate name={contractName} />;

  // my contracts are still loading
  if (isMyStakingContractsLoading) return <Loader />;

  // contract already nominated
  const contractAlreadyNominated = contractInfo.isNominated;
  if (!contractAlreadyNominated) return <ContractAlreadyNominated name={contractName} />;

  return (
    <Container>
      <NominatedContractContent
        contractName={contractName}
        contractInfo={myStakingContracts[contractIndex]}
      />
    </Container>
  );
};
