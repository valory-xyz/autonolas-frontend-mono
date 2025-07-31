import { Divider, Flex, Typography } from 'antd';
import Image from 'next/image';
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
      <Paragraph type="secondary">Get agents reliably doing work for your organization</Paragraph>
    </Flex>
    <Image
      src={'/images/docs/header.png'}
      width={HERO_MAX_WIDTH}
      height={440}
      alt="Govern App"
      className="mb-24"
    />
  </Hero>
);

const Intro = () => (
  <>
    <Paragraph className="mb-8 mt-20">
      Olas allows anyone to create staking contracts and commission AI agent work aligned with their
      goals.
    </Paragraph>
    <Paragraph>
      <Link href="https://olas.network/staking">Olas Staking</Link> is based on
      Proof-of-Active-Agent (PoAA) — a mechanism that rewards real AI agent activity, not passive
      token lockup. PoAA combines the strengths of Proof-of-Stake and Proof-of-Work, but shifts
      rewards to agents that deliver useful, verifiable outcomes — like executing on-chain actions
      or meeting KPIs.
    </Paragraph>
    <Paragraph className="mb-0">
      By defining KPIs and embedding them in staking contracts deployed on-chain, individuals,
      organizations, or DAOs can bootstrap{' '}
      <Link href="https://olas.network/agent-economies">agent economies</Link> through OLAS
      incentives.
    </Paragraph>
  </>
);

const QuickStart = () => (
  <>
    <Title level={4} className="mt-0">
      Quick Start
    </Title>
    <Paragraph>
      <Text strong>Create your staking contract →</Text>{' '}
      <Link href="/ethereum/my-staking-contracts">
        https://launch.olas.network/ethereum/my-staking-contracts
      </Link>
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
          <Text strong>Staking Contracts:</Text> Smart contracts that reward agents for completing
          predefined tasks based on KPIs.
        </li>
        <li className="mb-8">
          <Text strong>KPI (Key Performance Indicator):</Text> The success metric used to determine
          agent eligibility for rewards.
        </li>
        <li className="mb-8">
          <Text strong>Template (Implementation):</Text> the core logic of a contract, which
          describes how to use the set of variables provided by the contract creator.
        </li>
        <li className="mb-8">
          <Text strong>Nomination:</Text> The process to make staking contracts eligible for OLAS
          emissions through DAO voting.
        </li>
      </ul>
    </Paragraph>
  </>
);

const StepByStep = () => (
  <>
    <Title level={4} className="mt-0">
      Step-by-Step Guides
    </Title>
    <Title level={3} className="mt-0 mb-0">
      How to Launch a Staking Contract
    </Title>
    <ol>
      <li>
        <Text strong>Create a Staking Contract</Text>
        <br />
        Use Olas Launch to define your goals and KPIs and deploy a staking contract using a
        configuration template. Activity checks can be tailored to your specific agent type and
        objective. Once deployed, staking contracts are immutable.
        <br />
        Check out example staking contracts and configurations in the{' '}
        <a
          href="https://github.com/valory-xyz/autonolas-staking-programmes/tree/main/contracts"
          target="_blank"
          rel="noopener noreferrer"
        >
          Olas Staking Programmes GitHub repo
        </a>
        .
      </li>
      <li>
        <Text strong>Nominate for OLAS Emissions</Text>
        <br /> Submit your staking contract to Olas Govern. Nomination makes it eligible to receive
        OLAS incentives based on DAO voting.
      </li>
      <li>
        <Text strong>Promote to the Community</Text>
      </li>
    </ol>

    <Paragraph>
      Promote your staking contract to <Text strong>veOLAS holders</Text> to attract votes.
      Contracts that receive at least 0.5% of total veOLAS votes across all staking contracts in the
      current epoch become eligible for OLAS emissions.
    </Paragraph>

    <Paragraph>
      <Text strong>Key Points</Text>
      <ul>
        <li>
          <Text strong>Minimum vote threshold:</Text> 0.5% of total veOLAS votes per epoch
        </li>
        <li>
          <Text strong>Maximum emissions:</Text> 60,000 OLAS per epoch per eligible contract
        </li>
        <li>
          Additional votes beyond the threshold do <Text strong>not</Text> increase emissions
        </li>
      </ul>
    </Paragraph>

    <Paragraph>
      <Text strong>Check on-chain values:</Text>
      <ul>
        <li>maxStakingIncentive: Maximum emissions (60,000 OLAS)</li>
        <li>minStakingWeight: Minimum vote threshold (50 = 0.5%)</li>
        <li>
          ongoingEpoch: The current active voting epoch (used as input to query emission eligibility
          for your contract)
        </li>
      </ul>
    </Paragraph>

    <Paragraph>
      <Text strong>Learn more:</Text> See the VoteWeighting section in the{' '}
      <a
        href="https://github.com/valory-xyz/autonolas-registries/blob/main/docs/StakingSmartContracts.pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        Staking Smart Contracts documentation
      </a>
      .
    </Paragraph>
  </>
);

const FAQs = () => (
  <>
    <Title level={4} className="mt-0">
      Troubleshooting / FAQs
    </Title>
    <Paragraph className="mb-8">
      <ul>
        <li className="mb-8">
          <Text strong>Can I change the KPI after deployment?</Text> No, staking contracts are
          immutable after creation.
        </li>
        <li className="mb-8">
          <Text strong>How do I make my contract eligible for OLAS rewards?</Text> You need to
          nominate your contract via the Olas Launch app.
        </li>
        <li className="mb-8">
          <Text strong>How can I improve the chances of receiving emissions?</Text> Promote your
          staking contract to veOLAS voters to attract more voting weight.
        </li>
      </ul>
    </Paragraph>
  </>
);

const Feedback = () => (
  <>
    <Title level={4} className="mt-0">
      Contributing / Feedback
    </Title>
    <Paragraph className="mb-0">
      Found outdated information or have suggestions?{' '}
      <Text strong>
        Submit issues or suggestions on{' '}
        <a
          href="https://github.com/valory-xyz/autonolas-frontend-mono/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </Text>
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
        <Feedback />
      </Content>
    </ContentWrapper>
  </>
);
