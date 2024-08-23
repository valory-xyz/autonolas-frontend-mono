import { BulbFilled, PlayCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { BREAK_POINT, COLOR } from 'libs/ui-theme/src';

const { Title, Paragraph } = Typography;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.md};
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  .ant-card-body {
    padding: 0;
  }
`;

const CardBody = styled.div`
  padding: 16px;
`;

const StyledImage = styled(Image)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  display: block;
  object-fit: cover;
`;

const StyledAddImage = styled(StyledImage)`
  border-top-right-radius: 0px;
  border-bottom-left-radius: 5px;
  border-bottom: 0;
  border-right: 1px solid ${COLOR.BORDER_GREY};
`;

type Agent = {
  id: string;
  name: string;
  description: string;
  comingSoon: boolean;
  urls: Record<string, string>;
  imageFilename: string;
};

const agents: Agent[] = [
  {
    id: '582c485c-a2ba-4c53-8c58-8eb7b34ef87c',
    name: 'Prediction Agent',
    description: 'Participates in prediction markets according to your strategy.',
    comingSoon: false,
    urls: {
      run: 'https://github.com/valory-xyz/trader-quickstart?tab=readme-ov-file#trader-quickstart',
      learnMore: 'https://olas.network/services/prediction-agents',
      gpt: 'https://chat.openai.com/g/g-6y88mEBzS-olas-trader-agent-guide',
    },
    imageFilename: 'prediction-agent.png',
  },
];

const AgentCard = ({ agent }: { agent: Agent }) => {
  const { id, name, description, imageFilename, urls, comingSoon } = agent;
  const { run, learnMore, gpt } = urls;

  return (
    <Col xs={24} sm={18} md={12} key={id} style={{ margin: '0 auto' }}>
      <StyledCard>
        <StyledImage
          alt={name}
          src={`/images/${imageFilename}`}
          layout="responsive"
          width={400}
          height={400}
        />
        <CardBody>
          <Title className="mt-0" level={4}>
            {name}
          </Title>
          <div className="mb-12">
            <Paragraph ellipsis={{ rows: 3, expandable: true }}>{description}</Paragraph>
          </div>
          {comingSoon ? (
            <Button block disabled>
              Coming soon
            </Button>
          ) : (
            <>
              {run && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlayCircleOutlined />}
                  href={run}
                  target="_blank"
                  className="mb-8"
                >
                  Run Agent
                </Button>
              )}
              <br />
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

export const AgentsPage = () => {
  return (
    <StyledMain>
      <Row gutter={[24, 24]} className="mb-48">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
        <Col sm={24} lg={24} style={{ width: '100%' }}>
          <StyledCard styles={{ body: { padding: 0 } }}>
            <Row>
              <Col span={7} className="p-0">
                <StyledAddImage
                  alt="baby robot surfing a wave, having an idea"
                  src="/images/add-your-own.png"
                  layout="fill"
                  objectFit="cover"
                />
              </Col>
              <Col span={17} className="p-16">
                <Title className="mt-0" level={4}>
                  Want people to run <b>your</b> agent?
                </Title>
                <Paragraph>
                  Build an autonomous service using Open Autonomy. Then, simply submit a pull
                  request including the quickstart.
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
      </Row>
    </StyledMain>
  );
};
