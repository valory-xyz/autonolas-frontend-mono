import { Divider, Flex, Typography } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
const { Paragraph, Title, Text } = Typography;

const HERO_MAX_WIDTH = 1312;
const CONTENT_MAX_WIDTH = 720;

const DIVIDER_STYLE = { margin: '40px 0' };

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${HERO_MAX_WIDTH}px;
  margin: 0 auto;
`;

const ContentWrapper = styled.div`
  padding: 16px 0 40px;
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
  border-bottom: 1px solid ${COLOR.BORDER_GREY_2};
  background-color: ${COLOR.WHITE};
  display: flex;
  flex-direction: column;
  margin: 0 -40px -40px -40px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${CONTENT_MAX_WIDTH}px;
  margin: 0 auto;
`;

const HeroSection = () => (
  <Hero>
    <Flex align="center" vertical gap={16} className="mb-24">
      <Title className="m-0">Docs</Title>
    </Flex>
  </Hero>
);

const Intro = () => (
  <>
    <Paragraph className="mb-8 mt-20">
      Olas Operate empowers users to run fully self-custodial AI agents directly on their own
      devices. Through the <Link href="https://olas.network/pearl">Pearl app</Link> - AI Agent App
      Store or through{' '}
      <a
        href="https://github.com/valory-xyz/quickstart?tab=readme-ov-file#olas-agents---quickstart"
        target="_blank"
        rel="noopener noreferrer"
      >
        Quickstart
      </a>
      , users become Olas Operators - gaining full ownership and autonomy as their agents act
      independently to fulfill defined tasks and goals.
    </Paragraph>
  </>
);

const QuickStart = () => (
  <>
    <Title level={4} className="mt-0">
      Quick Start
    </Title>
    <Paragraph>
      <Text strong>Get started in 5 minutes:</Text>
      <ul>
        <li className="mb-8">
          <Text strong>
            Install <Link href="https://olas.network/pearl">Pearl</Link> (The AI Agent App Store) or{' '}
            <a
              href="https://github.com/valory-xyz/quickstart?tab=readme-ov-file#olas-agents---quickstart"
              target="_blank"
              rel="noopener noreferrer"
            >
              Quickstart
            </a>
          </Text>{' '}
          <br />
          Choose the option suitable for your device and needs.
        </li>
        <li className="mb-8">
          <Text strong>Setup</Text>
          <br />
          Follow the displayed instructions to set up in a few minutes.
        </li>
        <li>
          <Text strong>Start earning rewards</Text>
          <br />
          Click “Run Agent” and start earning potential rewards.
        </li>
      </ul>
    </Paragraph>
  </>
);

const CoreConcepts = () => (
  <>
    <Title level={4} className="mt-0">
      Core Concepts
    </Title>
    <Paragraph>
      <ul>
        <li className="mb-8">
          <Text strong>OLAS Staking and Rewards</Text>
          <br />
          To run an agent, you need to stake a pre-defined amount of OLAS. When the AI agent
          achieves its KPI for the epoch (e.g. ~24 hours), it earns staking rewards in OLAS. This
          process allows for regular reward accumulation for each AI agent.
        </li>
        <li className="mb-8">
          <Text strong>Staking contract</Text>
          <br />
          Each AI agent needs OLAS staked to run. The staking contract sets how much OLAS is needed
          and what rewards the agent gets for hitting its goals.
        </li>
        <li className="mb-8">
          <Text strong>Agent Activity</Text>
          <br />
          Through Pearl (AI Agent App Store) and Quickstart, you can monitor your AI agent&apos;s
          real-time actions.
        </li>
        <li>
          <Text strong>AgentUI</Text>
          <br />
          The Pearl AgentUI allows you to monitor your agent&apos;s performance and activity. You
          can also engage with your agent via a chat interface to guide its strategy and direction
          (not universally available for all AI agents).
          <br />
          Similarly, on Quickstart, you can monitor your agent&apos;s performance and configure it
          through the <Text strong>Quickstart scripts</Text>.
        </li>
      </ul>
    </Paragraph>
  </>
);

const StepByStep = () => (
  <>
    <Title level={4} className="mt-0 mb-0">
      Pearl Step-by-Step Guide
    </Title>

    <ol>
      <li className="mb-8">
        Download Pearl from the <a href="https://olas.network/pearl#download">Olas website</a>.
      </li>
      <li className="mb-8">Install Pearl on your Windows or Mac computer.</li>
      <li className="mb-8">
        To create your Pearl account, you must:
        <ol type="a">
          <li className="mb-8">Set up a password.</li>
          <li className="mb-8">Store your Pearl seed phrase.</li>
          <li className="mb-8">Link a backup wallet.</li>
        </ol>
      </li>
      <li className="mb-8">
        Select the agent you want to operate (some agents may require quick initial setup).
      </li>
      <li className="mb-8">
        Fund your agent using either Direct Funding, Bridging or Fiat On-ramping (where available).
      </li>
      <li>Start your agent.</li>
    </ol>

    <Title level={4} className="mt-0 mb-0">
      Quickstart Guide
    </Title>

    <ol>
      <li className="mb-8">
        Download the{' '}
        <a
          href="https://github.com/valory-xyz/quickstart?tab=readme-ov-file#olas-agents---quickstart"
          target="_blank"
          rel="noopener noreferrer"
        >
          Quickstart
        </a>{' '}
        repository from GitHub.
      </li>
      <li className="mb-8">Follow the instructions in the README.</li>
      <li>Start your agent.</li>
    </ol>
  </>
);

const FAQs = () => (
  <>
    <Title level={3} className="mt-0">
      Troubleshooting / FAQs
    </Title>
    <Paragraph>
      <Text strong>Where is my agent hosted?</Text>
      <br />
      Every Pearl agent runs locally on the user&apos;s device, ensuring the Pearl app remains fully
      self-custodial and always under the user&apos;s complete control.
    </Paragraph>
    <Paragraph>
      <Text strong>Which AI agent can I find on Pearl?</Text>
      <br />
      Pearl and QuickStart feature a growing collection of AI agents designed to perform various
      tasks. All available AI agents can be found <Link href="/agents">here</Link>.
    </Paragraph>
    <Paragraph>
      <Text strong>Why does my agent require funds?</Text>
      <br />
      Your agent requires funds for two main purposes:
      <ul>
        <li className="mb-8">
          <Text strong>Staking OLAS tokens:</Text> These tokens are required to stake and run the
          agent.
        </li>
        <li className="mb-8">
          <Text strong>Covering task-specific costs:</Text> This includes funds for the agent&apos;s
          unique goals and activities. For example, a Prediction agent would need xDAI to place bets
          in prediction markets and pay for gas.
        </li>
      </ul>
    </Paragraph>
    <Paragraph>
      <Text strong>Can I run an AI agent without using the Pearl app?</Text>
      <br />
      Yes, using the CLI (Command-Line Interface). For more technical control, you can set up and
      run agents manually using Quickstart. Click{' '}
      <a
        href="https://github.com/valory-xyz/quickstart?tab=readme-ov-file#olas-agents---quickstart"
        target="_blank"
        rel="noopener noreferrer"
      >
        here
      </a>{' '}
      to get started.
    </Paragraph>
    <Paragraph>
      <Text strong>Where can I get support if I encounter issues?</Text>
      <br />
      Join the{' '}
      <a
        href="https://discord.com/channels/899649805582737479/1244588374736502847"
        target="_blank"
        rel="noopener noreferrer"
      >
        Discord
      </a>{' '}
      community for help, where you can{' '}
      <a
        href="https://discord.com/channels/899649805582737479/1335000001797034044"
        target="_blank"
        rel="noopener noreferrer"
      >
        create a support ticket
      </a>{' '}
      directly.
    </Paragraph>
  </>
);

const LearnMore = () => (
  <>
    <Title level={4} className="mt-0">
      Learn More
    </Title>
    <ul>
      <li>
        <a href="https://olas.network/pearl">Pearl, the AI agent App Store</a>
      </li>
      <li>
        <a href="https://olas.network/staking">Staking</a>
      </li>
      <li>
        <a href="https://olas.network/olas-token">Tokenomics</a>
      </li>
    </ul>
  </>
);

const Feedback = () => (
  <>
    <Title level={4} className="mt-0">
      Contributing / Feedback
    </Title>
    <Paragraph>
      Found outdated information or have suggestions? Submit issues or suggestions on{' '}
      <a
        href="https://github.com/valory-xyz/autonolas-frontend-mono/issues"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
      .
    </Paragraph>
  </>
);

export const DocsPage = () => (
  <>
    <HeroSection />
    <ContentWrapper>
      <Content>
        <Intro />
        <Divider style={DIVIDER_STYLE} />
        <QuickStart />
        <Divider style={DIVIDER_STYLE} />
        <CoreConcepts />
        <Divider style={DIVIDER_STYLE} />
        <StepByStep />
        <Divider style={DIVIDER_STYLE} />
        <FAQs />
        <Divider style={DIVIDER_STYLE} />
        <LearnMore />
        <Divider style={DIVIDER_STYLE} />
        <Feedback />
      </Content>
    </ContentWrapper>
  </>
);
