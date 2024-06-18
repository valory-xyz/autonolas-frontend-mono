import { Card, Flex, Skeleton, Space, Typography } from 'antd';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { mainnet } from 'viem/chains';
import { useEnsName } from 'wagmi';

import { CHAIN_NAMES, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { EXPLORE_URLS } from 'common-util/constants/urls';
import { getAddressFromBytes32, truncateAddress } from 'common-util/functions';
import { useContractParams } from 'hooks/index';
import { useAppSelector } from 'store/index';
import { StakingContract } from 'types/Contract';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 24px;
`;

const { Text, Paragraph } = Typography;

type ContractPageContentProps = {
  contract: StakingContract;
};

const ContractPageContent = ({ contract }: ContractPageContentProps) => {
  const formattedAddress = contract ? getAddressFromBytes32(contract.address) : '';

  const { data: contractParams } = useContractParams(formattedAddress, contract.chainId);

  const { data: ensName, isFetching: isEnsNameFetching } = useEnsName({
    address: contractParams?.deployer,
    chainId: mainnet.id,
    query: { refetchOnWindowFocus: false },
  });

  return (
    <StyledMain>
      <Card>
        <Title>{contract.metadata.name}</Title>
        <Space direction="vertical">
          <Text type="secondary">Description</Text>
          <Paragraph>{contract.metadata.description}</Paragraph>
        </Space>
        <Flex justify="space-between">
          <Space direction="vertical">
            <Text type="secondary">Owner address</Text>
            {contractParams && !isEnsNameFetching ? (
              <a
                href={`${EXPLORE_URLS[contract.chainId]}/address/${contractParams.deployer}`}
                target="_blank"
              >
                {`${ensName || truncateAddress(contractParams.deployer)} ${
                  UNICODE_SYMBOLS.EXTERNAL_LINK
                }`}
              </a>
            ) : (
              <Skeleton.Input active size="small" />
            )}
          </Space>
          <Space direction="vertical">
            <Text type="secondary">Chain</Text>
            <Text>{CHAIN_NAMES[contract.chainId]}</Text>
          </Space>
          <Space direction="vertical">
            <Text type="secondary">Contract address</Text>
            <a
              href={`${EXPLORE_URLS[contract.chainId]}/address/${formattedAddress}`}
              target="_blank"
            >
              {`${truncateAddress(formattedAddress)} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
            </a>
          </Space>
        </Flex>
      </Card>
    </StyledMain>
  );
};

export const ContractPage = () => {
  const { stakingContracts } = useAppSelector((state) => state.govern);
  const router = useRouter();
  const addressParam = router?.query?.address;

  const contract = stakingContracts.find((item) => item.address === addressParam);

  if (!contract) return null;

  return <ContractPageContent contract={contract} />;
};
