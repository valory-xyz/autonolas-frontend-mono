import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Row, Spin, Tag, Typography } from 'antd';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';
import styled from 'styled-components';

import { EXPLORER_URLS, GOVERN_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { truncateAddress } from 'libs/util-functions/src';

import { ChainId, IMPLEMENTATION_ADDRESSES } from 'common-util/constants/stakingContract';
import { URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

import { ContractConfiguration } from './ContractConfiguration';
import { ColFlexContainer } from './helpers';

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
        <Button
          size="large"
          type="primary"
          onClick={() => router.push(`/${networkName}/my-staking-contracts`)}
        >
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
        are allocated via{' '}
        <a href={GOVERN_URL} target="_blank" rel="noreferrer">
          Govern {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </a>
        .
      </>
    }
    type="info"
    showIcon
    data-testid="nominate-info"
  />
);

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
        icon={<CopyOutlined />}
        onClick={() => navigator.clipboard.writeText(address)}
        style={{ margin: '-4px 0 0 8px' }}
      />
    </Flex>
  );
};

const Template: FC<{ template: string }> = ({ template }) => {
  const { networkId } = useAppSelector((state) => state.network);

  return (
    <Flex vertical gap={4}>
      <Text>{template}</Text>
      {networkId ? (
        <a
          href={`${EXPLORER_URLS[networkId]}/address/${
            IMPLEMENTATION_ADDRESSES[networkId as ChainId]
          }`}
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
        <Paragraph
          ellipsis={{ rows: 6, expandable: true, symbol: 'Expand description' }}
          className="mb-0"
        >
          {myStakingContract.description}
        </Paragraph>
      </Flex>

      <Row gutter={24}>
        <ColFlexContainer
          text="Template"
          content={<Template template={myStakingContract.template} />}
        />
        <ColFlexContainer text="Chain" content={<Text>{networkDisplayName}</Text>} />
      </Row>
    </>
  );
};

export const Details = () => {
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
    <>
      <Container>
        <Flex gap={24} vertical>
          <Title level={4} className="m-0">
            {`Contract #${myStakingContractIndex + 1} ${myStakingContract.name}`}
          </Title>
          <EachStakingContractContent myStakingContract={myStakingContract} />
        </Flex>
      </Container>

      <br />

      <Container>
        <Flex gap={24} vertical>
          <Title level={5} className="m-0">
            Contract configuration
          </Title>
          <ContractConfiguration myStakingContract={myStakingContract} />
        </Flex>
      </Container>
    </>
  );
};
