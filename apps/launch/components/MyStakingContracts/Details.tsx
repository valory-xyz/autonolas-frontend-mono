import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Spin, Tag, Typography } from 'antd';
import { useRouter } from 'next/router';
import { Children, FC, ReactNode } from 'react';
import styled from 'styled-components';

import { URL } from 'common-util/constants/urls';
import { useAppDispatch, useAppSelector } from 'store/index';

const { Paragraph, Text, Title } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
  /* .ant-card-body {
    min-height: 300px;
  } */
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

// TODO: maybe reuse from staking contract
const NotFound = () => {
  const router = useRouter();
  const { networkName } = useAppSelector((state) => state.network);

  return (
    <Container>
      <Title level={2}>Contract not found...</Title>
      <Paragraph>
        We couldn’t find the staking contract you’re referring to. Go to your staking contracts and
        try again.
      </Paragraph>

      <Button type="primary" onClick={() => router.push(`/${networkName}/my-staking-contracts`)}>
        My staking contracts
      </Button>
    </Container>
  );
};

export const EachStakingContract = () => {
  const router = useRouter();
  const id = router.query.id;
  const { networkName } = useAppSelector((state) => state.network);

  const { myStakingContracts, isMyStakingContractsLoading } = useAppSelector(
    (state) => state.launch,
  );

  const myStakingContractIndex = myStakingContracts.findIndex((contract) => contract.id === id);

  if (isMyStakingContractsLoading) return <Loader />;
  if (myStakingContractIndex === -1) return <NotFound />;

  const myStakingContract = myStakingContracts[myStakingContractIndex];
  const name = `Contract #${myStakingContractIndex + 1} ${myStakingContract.name}`;

  // TODO: fix this
  const maxNumServices = 100;

  // TODO: fix this
  const rewardsPerSecond = 0;

  return (
    <Container>
      <Flex gap={24} vertical>
        <Title level={4} className="m-0">
          {name}
        </Title>

        <Row gutter={24}>
          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary">Nominated for incentives?</Text>
              <Text>
                {myStakingContract.isNominated ? (
                  <Tag color="success">
                    <CheckCircleOutlined />
                    &nbsp;Nominated
                  </Tag>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => router.push(`/${networkName}/${URL.nominateContract}`)}
                  >
                    Nominate
                  </Button>
                )}
              </Text>
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary">Address</Text>

              {/* TODO: truncate and link */}
              <Text>{myStakingContract.id}</Text>
            </Flex>
          </Col>
        </Row>

        <Flex gap={4} vertical>
          <Text type="secondary">Description</Text>
          <Paragraph>{myStakingContract.description}</Paragraph>
        </Flex>

        <Row gutter={24}>
          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary">Template</Text>
              <Text>{myStakingContract.template}</Text>
              {/* TODO: add link */}
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary">Chain</Text>

              {/* TODO: change to network display name */}
              <Text>{networkName}</Text>
            </Flex>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary">Maximum number of staked services</Text>
              <Text>{maxNumServices}</Text>
            </Flex>
          </Col>

          <Col span={12}>
            <Flex vertical gap={4}>
              <Text type="secondary">Rewards, OLAS per second</Text>
              <Text>{`${rewardsPerSecond} OLAS`}</Text>
            </Flex>
          </Col>
        </Row>
      </Flex>
    </Container>
  );
};

// https://github.com/valory-xyz/autonolas-frontend-mono/blob/main/libs/util-contracts/src/lib/abiAndAddresses/stakingToken.js#L1015

// https://github.com/valory-xyz/autonolas-frontend-mono/blob/main/libs/util-contracts/src/lib/abiAndAddresses/stakingToken.js#L1127
