import { Card, Flex, Typography } from 'antd';
import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { mainnet } from 'viem/chains';
import { useAccount, useSwitchChain } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src';

import { addNominee } from 'common-util/functions';
import { LogoSvg } from 'components/Layout/Logos';
import { useAppSelector } from 'store/index';

const { Title, Paragraph, Text } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
`;

const LogoContainer = styled.div`
  margin: 0;
  text-align: center;
  scale: 1.4;
`;

const PurpleDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${COLOR.PRIMARY};
  display: inline-block;
  margin-right: 8px;
`;

export const NominatedContract = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { myStakingContracts } = useAppSelector((state) => state.launch);

  const contractIndex = myStakingContracts.findIndex((item) => item.id === id);

  const { chainId, address: account } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    if (chainId !== mainnet.id) {
      switchChainAsync({ chainId: mainnet.id });
      // TODO: need to do something if user rejects switching, e.g. show alert?
    } else {
      const contract = myStakingContracts[contractIndex];
      if (!contract) return;
      if (!account) return;

      addNominee({ address: contract.id, chainId: contract.chainId, account });
    }
  }, [chainId]);

  // TODO: move to separate component
  if (contractIndex === -1) return null;

  return (
    <StyledMain>
      <Card>
        <LogoContainer>
          <LogoSvg />
        </LogoContainer>

        <Title level={4}>Nominating staking contract...</Title>
        <Paragraph>{`Contract #${contractIndex + 1} ${
          myStakingContracts[contractIndex]?.name
        }`}</Paragraph>

        <Flex align="center">
          <PurpleDot />
          <Text>&nbsp;Waiting for transaction...</Text>
        </Flex>
      </Card>
    </StyledMain>
  );
};
