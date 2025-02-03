import { BulbFilled, RobotOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';
import { StakingContract } from 'types';

import { BREAK_POINT, COLOR } from 'libs/ui-theme/src';

import { RunAgentButton } from './RunAgentButton';

const { Title, Paragraph } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.md};
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  height: 100%;
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  .ant-card-body {
    padding: 0;
  }
`;

const CardBody = styled.div`
  padding: 24px;
`;

const StyledImage = styled(Image)`
  padding: 8px;
  display: block;
  object-fit: cover;
`;

const AddImageContainer = styled.div`
  min-height: 224px;
`;

const StyledAddImage = styled(StyledImage)`
  border-radius: 8px;
`;

type Agent = {
  id: string;
  name: string;
  description: string;
  comingSoon: boolean;
  availableOn: StakingContract['availableOn'][];
  urls: Record<string, string>;
  imageFilename: string;
};

const agents: Agent[] = [
  {
    id: 'prediction-agent',
    name: 'Prediction Agent',
    description: 'Participates in prediction markets according to your strategy.',
    comingSoon: false,
    availableOn: ['pearl', 'quickstart'],
    urls: {
      learnMore: 'https://olas.network/services/prediction-agents',
      gpt: 'https://chat.openai.com/g/g-6y88mEBzS-olas-trader-agent-guide',
    },
    imageFilename: 'prediction-agent.png',
  },
  {
    id: 'optimus-agent',
    name: 'Optimus Agent',
    description:
      'Streamlines your DeFi experience by intelligently managing your assets across the Superchain.',
    comingSoon: false,
    availableOn: ['optimusQuickstart'],
    urls: {
      learnMore: 'https://olas.network/services/babydegen#optimus-agent',
    },
    imageFilename: 'optimus-agent.png',
  },
  {
    id: 'modius-agent',
    name: 'Modius Agent',
    description: 'Invests crypto assets on your behalf and grows your portfolio on Mode chain.',
    comingSoon: false,
    availableOn: ['pearl', 'modiusQuickstart'],
    urls: {
      learnMore: 'https://olas.network/services/babydegen#modius-agent',
    },
    imageFilename: 'modius-agent.png',
  },
  {
    id: 'agents.fun-agent',
    name: 'Agents.fun agent',
    description:
      'Creates сustomized AI influencer personas that post on X and perform tasks on Base chain.',
    comingSoon: false,
    availableOn: ['pearl'],
    urls: {
      learnMore: 'https://olas.network/services/agentsfun',
    },
    imageFilename: 'agents.fun-agent.png',
  },
];

const AgentCard = ({ agent }: { agent: Agent }) => {
  const { id, name, description, imageFilename, urls, comingSoon, availableOn } = agent;
  const { learnMore, gpt } = urls;

  return (
    <Col xs={24} sm={18} md={12} key={id} style={{ margin: '0 auto' }}>
      <StyledCard>
        <StyledImage
          alt={name}
          src={`/images/${imageFilename}`}
          layout="responsive"
          width={352}
          height={344}
        />
        <CardBody>
          <Title className="mt-0" level={4}>
            {name}
          </Title>
          <div className="mb-12">
            <Paragraph ellipsis={{ rows: 3, expandable: true }} type="secondary">
              {description}
            </Paragraph>
          </div>
          {comingSoon ? (
            <Button block disabled>
              Coming soon
            </Button>
          ) : (
            <>
              {availableOn && availableOn.length !== 0 && (
                <Flex gap={8} justify="space-between" className="mb-8">
                  {availableOn.map((type) => (
                    <RunAgentButton
                      availableOn={type}
                      type="default"
                      key={type}
                      className="full-width"
                    />
                  ))}
                </Flex>
              )}
              {learnMore && (
                <Button
                  type="default"
                  block
                  href={learnMore}
                  target="_blank"
                  style={{ marginRight: '8px' }}
                  className="mb-8"
                >
                  Learn More
                </Button>
              )}
              {gpt && (
                <Button type="default" block icon={<RobotOutlined />} href={gpt} target="_blank">
                  GPT Guide
                </Button>
              )}
            </>
          )}
        </CardBody>
      </StyledCard>
    </Col>
  );
};

const WantPeopleToRunYourAgent = () => (
  <Col sm={24} lg={24} style={{ width: '100%' }}>
    <StyledCard styles={{ body: { padding: 0 } }}>
      <Row>
        <Col span={7} className="p-0">
          <AddImageContainer>
            <StyledAddImage
              alt="baby robot surfing a wave, having an idea"
              src="/images/add-your-own.png"
              layout="fill"
              objectFit="cover"
            />
          </AddImageContainer>
        </Col>
        <Col span={17} className="p-16">
          <Title className="mt-0 mb-16" level={4}>
            Want people to run <b>your</b> agent?
          </Title>
          <Paragraph type="secondary" className="mb-24">
            Build an autonomous service using Open Autonomy. Then, simply submit a pull request
            including the quickstart.
          </Paragraph>
          <Button
            type="default"
            icon={<BulbFilled />}
            href="https://github.com/valory-xyz/autonolas-operate-frontend?tab=readme-ov-file#add-your-own-agent"
            target="_blank"
            rel="noopener noreferrer"
          >
            Add your own
          </Button>
        </Col>
      </Row>
    </StyledCard>
  </Col>
);

export const AgentsPage = () => {
  return (
    <StyledMain>
      <Row gutter={[24, 24]} className="mb-48">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
        <WantPeopleToRunYourAgent />
      </Row>
    </StyledMain>
  );
};
