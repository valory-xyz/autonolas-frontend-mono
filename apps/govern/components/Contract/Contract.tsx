import { Alert, Card, Flex, Skeleton, Space, Typography } from 'antd';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { StakingContract } from 'types';
import { mainnet } from 'viem/chains';
import { useEnsName } from 'wagmi';

import { CHAIN_NAMES, EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { getAddressFromBytes32, truncateAddress } from 'common-util/functions/addresses';
import { useContractParams } from 'hooks/index';
import { useAppSelector } from 'store/index';

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
    <>
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
              href={`${EXPLORER_URLS[contract.chainId]}/address/${contractParams.deployer}`}
              target="_blank"
              data-testid="owner-address"
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
            href={`${EXPLORER_URLS[contract.chainId]}/address/${formattedAddress}`}
            target="_blank"
            data-testid="contract-address"
          >
            {`${truncateAddress(formattedAddress)} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
          </a>
        </Space>
      </Flex>
    </>
  );
};

const ContractContent = () => {
  const router = useRouter();
  const { isStakingContractsLoading, stakingContracts } = useAppSelector((state) => state.govern);

  const contract = stakingContracts.find((item) => item.address === router?.query?.address);

  if (isStakingContractsLoading) {
    return <Skeleton active />;
  }

  if (!contract) {
    return (
      <Alert
        message="Contract not found"
        description="The contract you are looking for does not exist."
        type="error"
        showIcon
      />
    );
  }

  return <ContractPageContent contract={contract} />;
};

export const ContractPage = () => (
  <StyledMain>
    <Card>
      <ContractContent />
    </Card>
  </StyledMain>
);
