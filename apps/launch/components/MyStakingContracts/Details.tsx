import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Flex, Row, Skeleton, Spin, Tag, Typography } from 'antd';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { Address } from 'viem';
import { useReadContract } from 'wagmi';

import { NA } from '@autonolas/frontend-library';

import { EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { STAKING_TOKEN } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { truncateAddress } from 'libs/util-functions/src';

import { GOVERN_URL, URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

const { Paragraph, Text, Title } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
`;

const Container: FC<{ children: ReactNode }> = ({ children }) => (
  <StyledMain>
    <Card>{children}</Card>
  </StyledMain>
);

const Loader = () => (
  <Container>
    <Flex justify="center" align="center" style={{ height: '300px' }}>
      <Spin />
    </Flex>
  </Container>
);

const NotFound = () => {
  const router = useRouter();
  const { networkName } = useAppSelector((state) => state.network);

  return (
    <Container>
      <Title level={4} className="mt-0">
        Contract not found...
      </Title>
      <Paragraph>
        We couldn’t find the staking contract you’re referring to. Go to your staking contracts and
        try again.
      </Paragraph>

      <Flex justify="center">
        <Button type="primary" onClick={() => router.push(`/${networkName}/my-staking-contracts`)}>
          My staking contracts
        </Button>
      </Flex>
    </Container>
  );
};

const NominateInfo = () => (
  <Alert
    message={
      <>
        Nominate your contract to make it eligible to receive staking incentives. Staking incentives
        are allocated via&nbsp;
        <a href={GOVERN_URL} target="_blank" rel="noreferrer">
          Govern {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </a>
        .
      </>
    }
    type="info"
    showIcon
  />
);

type ColFlexContainerProps = { text: string; content: ReactNode };
const ColFlexContainer: FC<ColFlexContainerProps> = ({ text, content }) => {
  return (
    <Col span={12}>
      <Flex vertical gap={4} align="flex-start">
        <Text type="secondary">{text}</Text>
        {content}
      </Flex>
    </Col>
  );
};

const NominatedForIncentives: FC<{ isNominated: boolean }> = ({ isNominated }) => {
  const router = useRouter();
  const { networkName } = useAppSelector((state) => state.network);

  return isNominated ? (
    <Tag color="success">
      <CheckCircleOutlined />
      &nbsp;Nominated
    </Tag>
  ) : (
    <Button type="primary" onClick={() => router.push(`/${networkName}/${URL.nominateContract}`)}>
      Nominate
    </Button>
  );
};

const ContractAddress: FC<{ address: string }> = ({ address }) => {
  const { networkId } = useAppSelector((state) => state.network);
  const truncatedAddress = truncateAddress(address);

  if (!networkId) return null;

  return (
    <Flex align="flex-start" gap={4}>
      <a href={`${EXPLORER_URLS[networkId]}/address/${address}`} target="_blank" rel="noreferrer">
        {`${truncatedAddress} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
      </a>

      <Button
        size="small"
        icon={<CopyOutlined />}
        onClick={() => navigator.clipboard.writeText(address)}
        style={{ margin: '-4px 0 0 8px' }}
      />
    </Flex>
  );
};

const Template: FC<{ address: string; template: string }> = ({ address, template }) => {
  const { networkId } = useAppSelector((state) => state.network);

  return (
    <Flex vertical gap={4}>
      <Text>{template}</Text>
      {networkId ? (
        <a
          href={`${EXPLORER_URLS[networkId]}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '90%' }}
        >
          View on explorer {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </a>
      ) : null}
    </Flex>
  );
};

const MaxNumOfStakedServices: FC<{ address: Address }> = ({ address }) => {
  const { networkId } = useAppSelector((state) => state.network);
  const { data, isLoading } = useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: 'maxNumServices',
    query: {
      enabled: !!networkId,
      select: (data) => (typeof data === 'bigint' ? data.toString() : '0'),
    },
  });

  if (!networkId || isLoading) return <Skeleton.Input active size="small" />;

  return <Text>{data || NA}</Text>;
};

const Rewards: FC<{ address: Address }> = ({ address }) => {
  const { networkId } = useAppSelector((state) => state.network);
  const { data, isLoading } = useReadContract({
    address,
    abi: STAKING_TOKEN.abi,
    chainId: networkId as number,
    functionName: 'rewardsPerSecond',
    query: {
      enabled: !!networkId,
      select: (data) => (typeof data === 'bigint' ? ethers.formatEther(data) : '0'),
    },
  });

  if (!networkId || isLoading) return <Skeleton.Input active size="small" />;

  return <Text>{`${data} OLAS` || NA}</Text>;
};

const EachStakingContractContent: FC<{ myStakingContract: MyStakingContract }> = ({
  myStakingContract,
}) => {
  const { networkDisplayName } = useAppSelector((state) => state.network);

  return (
    <>
      {myStakingContract.isNominated ? null : <NominateInfo />}

      <Row gutter={24}>
        <ColFlexContainer
          text="Nominated for incentives?"
          content={<NominatedForIncentives isNominated={myStakingContract.isNominated} />}
        />
        <ColFlexContainer
          text="Address"
          content={<ContractAddress address={myStakingContract.id} />}
        />
      </Row>

      <Flex gap={4} vertical>
        <Text type="secondary">Description</Text>
        <Paragraph ellipsis={{ rows: 6, expandable: true, symbol: 'Expand description' }}>
          {myStakingContract.description}
        </Paragraph>
      </Flex>

      <Row gutter={24}>
        <ColFlexContainer
          text="Template"
          content={
            <Template address={myStakingContract.id} template={myStakingContract.template} />
          }
        />
        <ColFlexContainer text="Chain" content={<Text>{networkDisplayName}</Text>} />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text="Maximum number of staked services"
          content={<MaxNumOfStakedServices address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text="Rewards, OLAS per second"
          content={<Rewards address={myStakingContract.id} />}
        />
      </Row>
    </>
  );
};

export const EachStakingContract = () => {
  const router = useRouter();
  const { myStakingContracts, isMyStakingContractsLoading } = useAppSelector(
    (state) => state.launch,
  );

  const myStakingContractIndex = myStakingContracts.findIndex(
    (contract) => contract.id === router.query.id,
  );

  if (isMyStakingContractsLoading) return <Loader />;
  if (myStakingContractIndex === -1) return <NotFound />;

  const myStakingContract = myStakingContracts[myStakingContractIndex];

  return (
    <Container>
      <Flex gap={24} vertical>
        <Title level={4} className="m-0">
          {`Contract #${myStakingContractIndex + 1} ${myStakingContract.name}`}
        </Title>
        <EachStakingContractContent myStakingContract={myStakingContract} />
      </Flex>
    </Container>
  );
};
