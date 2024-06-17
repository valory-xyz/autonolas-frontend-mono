import { Button, Card, Col, Row, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 946px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 8px;
`;

const { Paragraph } = Typography;

type Proposal = {
  title: string;
  description: string;
  imageSrc: string;
  button: {
    title: string;
    href: string;
  };
};
const proposals: Proposal[] = [
  {
    title: 'Snapshot proposals',
    description: 'Proposals that are made and enacted off-chain.',
    imageSrc: '/images/snapshot.png',
    button: {
      title: 'Vote on Snapshot',
      href: 'https://snapshot.org/#/autonolas.eth',
    },
  },
  {
    title: 'Boardroom proposals',
    description: 'Proposals that are made and enacted on-chain.',
    imageSrc: '/images/boardroom.png',
    button: {
      title: 'Vote on Boardroom',
      href: 'https://boardroom.io/autonolas/',
    },
  },
];

const Proposal = ({ title, description, imageSrc, button }: Proposal) => {
  return (
    <Card>
      <Card.Meta
        avatar={<Image src={imageSrc} alt={''} width={24} height={24} className="mt-4" />}
        title={title}
        description={
          <>
            <Paragraph type="secondary">{description}</Paragraph>
            <Button type="primary" ghost href={button.href} target="_blank">
              {`${button.title} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
            </Button>
          </>
        }
      />
    </Card>
  );
};

export const ProposalsPage = () => {
  return (
    <StyledMain>
      <Card>
        <Title>Proposals</Title>
        <Paragraph type="secondary" className="mb-24">
          Participate in the Autonolas DAO governance by voting on proposals.
        </Paragraph>
        <Row gutter={24}>
          {proposals.map((item, index) => (
            <Col key={index} span={12}>
              <Proposal {...item} />
            </Col>
          ))}
        </Row>
      </Card>
    </StyledMain>
  );
};
