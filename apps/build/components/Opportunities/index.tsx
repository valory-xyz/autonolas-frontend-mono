import Image from 'next/image';
import { Button, Card, Col, Flex, Row, Tag, Typography } from 'antd';
import styled from 'styled-components';
import opportunities from './opportunities.json';

const LAUNCH_CONTACT_URL = 'mailto:sales@valory.xyz';

const StatusTag = styled(Tag)`
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  padding: 2px 8px 2px 8px;
`;

const StyledCard = styled(Card)`
  width: 100%;
  height: 100%;
  align-items: center;
  .ant-card-body {
    min-height: 100%;
    display: flex;
  }
  margin-bottom: 24px;
`;

type OpportunityCardProps = {
  agentName: string;
  agentDescription: string;
  project: string;
  image: string;
  background?: string;
  status?: string | null;
};

const OpportunityCard = ({
  agentName,
  agentDescription,
  project,
  image,
  background,
  status = null,
}: OpportunityCardProps) => (
  <StyledCard>
    <Row gutter={16} style={{ width: '100%' }}>
      <Col xs={24} md={16}>
        {status && (
          <StatusTag bordered color="green">
            {status}
          </StatusTag>
        )}
        <h2>{agentName}</h2>
        <p style={{ whiteSpace: 'pre-line' }}>{agentDescription}</p>
      </Col>
      <Col xs={24} md={8} style={{ fontSize: '0.875rem', lineHeight: '1.25rem' }}>
        <Flex gap={16}>
          <Image
            alt={project}
            src={image}
            width="100"
            height="100"
            style={{ objectFit: 'contain' }}
          />
          <Flex
            justify="center"
            vertical
            style={{
              letterSpacing: '0.05em',
            }}
          >
            <span style={{ fontWeight: 500 }}>PROJECT</span>
            <span style={{ fontWeight: 700 }}>{project}</span>
          </Flex>
        </Flex>
        <p>{background}</p>
        <Button type="primary" size="large" className="mb-8">
          <a href={LAUNCH_CONTACT_URL} target="_blank" rel="noopener noreferrer">
            Get in touch
          </a>
        </Button>
      </Col>
    </Row>
  </StyledCard>
);

const sortedOpportunities = opportunities.sort((a, b) => {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(b.date).getTime() - new Date(a.date).getTime();
});

export const Opportunities = () => (
  <div id="opportunities">
    <Typography.Title className="mt-0" level={2}>
      Opportunities
    </Typography.Title>
    <p>
      Projects are interested in bringing Olas agents to their ecosystem. This is a list of
      &quot;requests for agents&quot;.
    </p>

    <div>
      {sortedOpportunities.map((item: OpportunityCardProps) => (
        <OpportunityCard key={`${item.project} ${item.agentName}`} {...item} />
      ))}
    </div>
  </div>
);
