import {
  // Alert,
  Card,
  Flex,
  Spin,
  Typography,
} from 'antd';
import { useParams } from 'next/navigation';
import React, { FC, ReactNode, useEffect } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { addNominee } from 'common-util/functions';
import { LogoSvg } from 'components/Layout/Logos';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

import { LogoContainer, PurpleDot, StyledMain } from './styles';

const { Title, Paragraph, Text } = Typography;

const Container = ({ children }: { children: ReactNode }) => {
  return (
    <StyledMain>
      <Card>
        <LogoContainer>
          <LogoSvg />
        </LogoContainer>

        {children}
      </Card>
    </StyledMain>
  );
};

const Loader = () => (
  <Container>
    <Flex align="center" justify="center" style={{ height: 240 }}>
      <Spin />
    </Flex>
  </Container>
);

// const SwitchNetworkError = () => (
//   <Alert message="Please switch to the mainnet to nominate a contract." type="error" showIcon />
// );

type NominatedContractContentProps = { contractIndex: number; contractInfo: MyStakingContract };
const NominatedContractContent: FC<NominatedContractContentProps> = ({ contractInfo }) => {
  const { chainId, address: account } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { myStakingContracts } = useAppSelector((state) => state.launch);
  const contractIndex = myStakingContracts.findIndex((item) => item.id === id);

  useEffect(() => {
    if (chainId !== mainnet.id) {
      switchChainAsync({ chainId: mainnet.id });
      // TODO: need to do something if user rejects switching, e.g. show alert?
    } else {
      if (!account) return;

      addNominee({ address: contractInfo.id, chainId: contractInfo.chainId, account });
    }
  }, [account, chainId, contractInfo, switchChainAsync]);

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

export const NominatedContract = () => {
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
