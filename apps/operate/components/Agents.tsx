import { BulbOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Typography, Grid } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';
import { StakingContract } from 'types';

import { BREAK_POINT, COLOR } from 'libs/ui-theme/src';

import { RunAgentButton } from './RunAgentButton';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

const { Title, Paragraph, Link } = Typography;
const { useBreakpoint } = Grid;

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.xl};
  margin: 0 auto;
`;

const StyledCard = styled(Card)`
  height: 100%;
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  .ant-card-body {
    padding: 16px;
  }
`;

type Agent = {
  id: string;
  name: string;
  description: string;
  comingSoon: boolean;
  availableOn: StakingContract['availableOn'];
  urls: Record<string, string>;
  imageFilename: string;
};

const agents: Agent[] = [
  {
    id: 'prediction-agent',
    name: 'Polystrat',
    description: 'Trades Polymarket on autopilot while you do something else.',
    comingSoon: false,
    availableOn: ['pearl'],
    urls: {
      learnMore: 'https://www.pearl.you/polystrat',
    },
    imageFilename: 'polystrat.png',
  },
  {
    id: 'omenstrat',
    name: 'Omenstrat',
    description: 'Trades Omen prediction markets on autopilot while you do something else.',
    comingSoon: false,
    availableOn: ['pearl', 'quickstart'],
    urls: {
      learnMore: 'https://olas.network/agents/omenstrat',
    },
    imageFilename: 'omenstrat.png',
  },
  {
    id: 'optimus-agent',
    name: 'Optimus',
    description: 'Intelligently manages your DeFi assets across multiple blockchains.',
    comingSoon: false,
    availableOn: ['pearl', 'quickstart'],
    urls: {
      learnMore: 'https://olas.network/agents/babydegen#optimus-agent',
    },
    imageFilename: 'optimus-agent.png',
  },
  {
    id: 'pettbro',
    name: 'PettBro by pett.ai',
    description: 'Cares for and nurtures your digital pet autonomously, even when you’re away.',
    comingSoon: false,
    availableOn: ['pearl'],
    urls: {
      learnMore: 'https://agent.pett.ai/',
    },
    imageFilename: 'pettbro.png',
  },
  {
    id: 'agents.fun-agent',
    name: 'Agents.fun',
    description: 'Define your persona and let your AI agent grow your X audience autonomously.',
    comingSoon: false,
    availableOn: ['pearl'],
    urls: {
      learnMore: 'https://olas.network/agents/agentsfun',
    },
    imageFilename: 'agents.fun-agent.png',
  },
  {
    id: 'modius-agent',
    name: 'Modius',
    description: 'Manages your portfolio with cutting-edge strategies on Mode network.',
    comingSoon: false,
    availableOn: ['pearl'],
    urls: {
      learnMore: 'https://olas.network/agents/babydegen#modius-agent',
    },
    imageFilename: 'modius-agent.png',
  },
];

const AgentCard = ({ agent }: { agent: Agent }) => {
  const { xs, sm, md, lg } = useBreakpoint();
  const { name, description, imageFilename, urls, comingSoon, availableOn } = agent;
  const { learnMore, gpt } = urls;
  const isMobile = (xs || sm || md) && !lg;

  return (
    <Flex>
      <Image alt={name} src={`/images/${imageFilename}`} width={160} height={170} />

      <div style={{ padding: isMobile ? '8px 0 0 0' : '4px 0 0 24px' }}>
        <Title className="mt-0 mb-8" level={4}>
          {name}
        </Title>
        <Paragraph ellipsis={{ rows: 3, expandable: true }} type="secondary" className="mb-8">
          {description}
        </Paragraph>

        {comingSoon ? (
          <Button block disabled>
            Coming soon...
          </Button>
        ) : (
          <>
            <Flex gap={8}>
              {learnMore && (
                <Link href={learnMore} target="_blank">
                  Learn More {UNICODE_SYMBOLS.EXTERNAL_LINK}
                </Link>
              )}
              {gpt && (
                <>
                  {!!learnMore && UNICODE_SYMBOLS.BULLET}
                  <a href={gpt} target="_blank">
                    GPT Guide {UNICODE_SYMBOLS.EXTERNAL_LINK}
                  </a>
                </>
              )}
            </Flex>

            {availableOn && availableOn.length !== 0 && (
              <Flex gap={12} className="mt-16">
                {availableOn.map((type) => (
                  <RunAgentButton availableOn={type} type="default" key={type} />
                ))}
              </Flex>
            )}
          </>
        )}
      </div>
    </Flex>
  );
};

const WantPeopleToRunYourAgent = () => (
  <Flex gap={24}>
    <Image
      alt="baby robot surfing a wave, having an idea"
      src="/images/add-your-own.png"
      width={124}
      height={124}
    />
    <div>
      <Title className="mt-0 mb-8" level={4}>
        Want people to run your agent?
      </Title>
      <Paragraph type="secondary" className="mb-24">
        Build an autonomous service using Open Autonomy. Then, simply submit a pull request
        including the quickstart.
      </Paragraph>
      <Button
        type="default"
        icon={<BulbOutlined />}
        href="https://olas.network/accelerator"
        target="_blank"
        rel="noopener noreferrer"
      >
        Add your own
      </Button>
    </div>
  </Flex>
);

export const AgentsPage = () => {
  return (
    <StyledMain>
      <Row gutter={[24, 24]} className="mb-48">
        {agents.map((agent) => (
          <Col key={agent.id} xs={24} sm={18} md={12} style={{ margin: '0 auto' }}>
            <StyledCard>
              <AgentCard agent={agent} />
            </StyledCard>
          </Col>
        ))}
        <Col sm={24} lg={24} style={{ width: '100%' }}>
          <StyledCard>
            <WantPeopleToRunYourAgent />
          </StyledCard>
        </Col>
      </Row>
    </StyledMain>
  );
};
