import { Flex, Typography } from 'antd';
import { useParams } from 'next/navigation';
import React, { FC, useEffect, useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { addNominee } from 'common-util/functions';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

import { PurpleDot } from './styles';
import { Container, Loader, SwitchNetworkError } from './utils';

const { Title, Paragraph, Text } = Typography;

type NominatedContractContentProps = {
  contractIndex: number;
  contractInfo: MyStakingContract;
};

const NominatedContractContent: FC<NominatedContractContentProps> = ({
  contractIndex,
  contractInfo,
}) => {
  const { chainId, address: account } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const [isFailedToSwitch, setIsFailedToSwitch] = useState(false);

  useEffect(() => {
    if (chainId !== mainnet.id) {
      switchChainAsync({ chainId: mainnet.id })
        .then((result) => {
          console.log('result', result);
          // if (!result) setIsFailedToSwitch(true);
        })
        .catch(() => setIsFailedToSwitch(true));
      // TODO: need to do something if user rejects switching, e.g. show alert?
    } else {
      if (!account) return;

      addNominee({ address: contractInfo.id, chainId: contractInfo.chainId, account });
    }
  }, [account, chainId, contractInfo, switchChainAsync]);

  if (isFailedToSwitch) return <SwitchNetworkError />;
  return (
    <>
      <Title level={4}>Nominating staking contract...</Title>
      <Paragraph>{`Contract #${contractIndex + 1} ${contractInfo.name}`}</Paragraph>

      <Flex align="center">
        <PurpleDot />
        <Text>&nbsp;Waiting for transaction...</Text>
      </Flex>
    </>
  );
};

export const NominateContract = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { isMyStakingContractsLoading, myStakingContracts } = useAppSelector(
    (state) => state.launch,
  );
  const contractIndex = myStakingContracts.findIndex((item) => item.id === id);
  console.log('contractIndex', contractIndex);

  if (isMyStakingContractsLoading) return <Loader />;

  return (
    <Container>
      {contractIndex === -1 ? (
        <Title level={4}>Contract does not exists, please try again.</Title>
      ) : (
        <NominatedContractContent
          contractIndex={contractIndex}
          contractInfo={myStakingContracts[contractIndex]}
        />
      )}
    </Container>
  );
};
