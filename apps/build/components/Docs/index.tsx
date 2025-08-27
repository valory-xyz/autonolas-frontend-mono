import { Divider, Flex, Typography } from 'antd';
import { COLOR } from 'libs/ui-theme/src';
import Link from 'next/link';
import styled from 'styled-components';

const { Paragraph, Title, Text } = Typography;

const CONTENT_MAX_WIDTH = 720;

const DIVIDER_STYLE = { margin: '40px 0' };

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  max-width: auto;
  margin: 0 auto;
  background: #f2f4f9;
`;

const ContentWrapper = styled.div`
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
  border-bottom: 1px solid ${COLOR.BORDER_GREY_2};
  background-color: ${COLOR.WHITE};
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${CONTENT_MAX_WIDTH}px;
  margin: 0 auto;
`;

const HeroSection = () => (
  <Hero className="p-24">
    <Flex align="center" vertical gap={16}>
      <Title className="m-0 mt-24">Docs</Title>
    </Flex>
  </Hero>
);

const Intro = () => (
  <>
    <Paragraph className="mb-8 mt-24">
      Olas Builders are developers who create and contribute code and applications to the Olas
      ecosystem. Their work powers the tools Operators run, and in return, Builders are eligible for
      developer rewards based on the impact of their contributions.
    </Paragraph>
  </>
);

const QuickStart = () => (
  <>
    <Title level={4} className="mt-0">
      Quick start: How to become Olas Builder
    </Title>
    <Paragraph>
      <ul>
        {/* Links to disabled /paths page
        <li>
          <Link href="/paths">Select your builder path</Link>
        </li> */}
        <li>
          <a href="https://open-autonomy.docs.autonolas.tech/">Read the developer documentation</a>
        </li>
        <li>
          Optionally,{' '}
          <a
            href="https://www.youtube.com/playlist?list=PLXztsZv11CTfXiQK9OJhMwBkfgf4ETZkl"
            target="_blank"
            rel="noopener noreferrer"
          >
            watch the Olas Dev Academy videos
          </a>
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
          <Text strong>Developer rewards:</Text> Developers who mint their code to the Olas protocol
          are eligible for incentives. Users who find the code valuable can support its creators by
          making ETH donations. Additionally, the Olas protocol may provide optional OLAS token
          top-ups to further reward developers. Note: top-ups are currently paused.
        </li>
        <li className="mb-8">
          <Text strong>Olas agents:</Text> An AI agent is a software system that perceives its
          environment, makes decisions, and takes actions autonomously — without continuous human
          input — to achieve specific goals. Find out more{' '}
          <a href="https://olas.network/agents">here</a>.
        </li>
        <li className="mb-8">
          <Text strong>Mechs:</Text> A special type of agent that can be hired by other agents in
          order to do some work in exchange for a small payment. For example, mechs can offer access
          to LLM subscriptions so the hiring agent can make calls to paid LLMs.
        </li>
        <li>
          <Text strong>Mech tools:</Text> mech tools are code snippets that mechs can execute in
          order to fulfill a request. For example, a prediction tool would use AI to forecast the
          probability of a future event.
        </li>
      </ul>
    </Paragraph>
  </>
);

const StepByStep = () => (
  <>
    <Title level={4} className="mt-0 mb-0">
      Step-by-Step Guides
    </Title>

    <Paragraph className="mt-12">
      <ul>
        <li className="mb-8">
          Step 1 (optional):{' '}
          <a href="https://open-autonomy.docs.autonolas.tech/demos/hello-world/">
            Run the Hello World example
          </a>
        </li>
        <li className="mb-8">
          Step 2: create your own agent, component or mech tool. You can either use the{' '}
          <a
            href="https://github.com/valory-xyz/open-autonomy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Autonomy
          </a>{' '}
          framework or bring your own. If you choose Open Autonomy, you can use the{' '}
          <a
            href="https://github.com/valory-xyz/academy-learning-service"
            target="_blank"
            rel="noopener noreferrer"
          >
            learning service
          </a>{' '}
          as a template or to find useful code snippets.
        </li>
        <li>
          Step 3: <a href="https://registry.olas.network/ethereum/components">mint your code</a> to
          the Olas registry to receive an NFT that serves as proof of code ownership.
        </li>
      </ul>
    </Paragraph>
  </>
);

const FAQs = () => (
  <>
    <Title level={4} className="mt-0">
      Troubleshooting / FAQs
    </Title>
    <Paragraph>
      <Text strong>Can I contribute with something which is not an agent?</Text>
      <br />
      Yes, you can code components for other agents, for example, or mech tools.
    </Paragraph>
    <Paragraph>
      <Text strong>
        Do I need to use the Open Autonomy framework to build agents and components?
      </Text>
      <br />
      No, that&apos;s entirely optional. You can build your agent with any framework of your choice
      and then wrap it using the <a href="https://docs.olas.network/olas-sdk/">Olas SDK</a>.
    </Paragraph>
    <Paragraph>
      <Text strong>Can I build multi-agent services?</Text>
      <br />
      Yes, Open Autonomy natively supports multi-agent setups where several agents (can be the same
      or different types of agents) collaborate to achieve a goal.
    </Paragraph>
  </>
);

const LearnMore = () => (
  <>
    <Title level={4} className="mt-0">
      Learn More
    </Title>
    <Paragraph>
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
      </Content>
    </ContentWrapper>
  </>
);
