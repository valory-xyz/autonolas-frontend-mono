import { Button, Card, Flex, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { ProposalsList } from './ProposalsList';

const { Paragraph, Title: AntdTitle } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 8px;
`;

const SnapshotCard = () => (
  <Card className="mb-24">
    <Flex justify="space-between" align="center">
      <Flex gap={16} align="center">
        <Image src="/images/snapshot.png" alt="" width={32} height={32} />
        <div>
          <AntdTitle level={4} className="mt-0 mb-4">
            Snapshot proposals
          </AntdTitle>
          <Paragraph type="secondary" className="m-0">
            Proposals that are made and enacted off-chain.
          </Paragraph>
        </div>
      </Flex>
      <Button
        size="large"
        type="primary"
        ghost
        href="https://snapshot.org/#/autonolas.eth"
        target="_blank"
      >
        {`Vote on Snapshot ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
      </Button>
    </Flex>
  </Card>
);

export const ProposalsPage = () => (
  <StyledMain>
    <SnapshotCard />

    <Card>
      <Title>Proposals</Title>
      <Paragraph type="secondary" className="mb-24">
        Participate in the Autonolas DAO governance by voting on proposals.
      </Paragraph>

      <ProposalsList />
    </Card>
  </StyledMain>
);
