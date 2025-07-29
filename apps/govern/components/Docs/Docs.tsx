import { Divider, Flex, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
import Link from 'next/link';

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
      <Paragraph type="secondary">
        How to direct OLAS emissions to different staking contracts.
      </Paragraph>
    </Flex>
    <Image
      src={'/images/docs/header.png'}
      width={HERO_MAX_WIDTH}
      height={603}
      alt="Govern App"
      className="mb-24"
    />
  </Hero>
);

const WhatIsOlasGovern = () => (
  <>
    <Title level={3}>What is Olas Govern?</Title>
    <Paragraph className="mb-8">
      <Text strong>Olas Govern</Text> is a dApp for participating in Olas DAO governance. It enables
      members to use veOLAS to shape the Olas ecosystem by:
      <ul className="mt-8">
        <li>
          <Text strong>Voting on on-chain proposals</Text> to guide{' '}
          <Link href="/proposals">key decisions</Link> for the DAO.
        </li>
        <li>
          <Text strong>
            Locking OLAS into <Link href="/veolas">veOLAS</Link>
          </Text>{' '}
          to gain voting power for governance decisions, including proposals and social actions like
          tweet approvals.
        </li>
        <li>
          <Text strong>Starting new tokenomic epochs</Text> that kick off a fresh emission cycle for
          OLAS, with epoch switched here{' '}
          <Link href="https://govern.olas.network/donate">https://govern.olas.network/donate</Link>{' '}
          and emissions data tracked here{' '}
          <Link href="https://olas.network/olas-token">https://olas.network/olas-token</Link>.
        </li>
        <li>
          <Text strong>Directing OLAS emissions</Text> to specific staking contracts through veOLAS
          voting, supporting the growth of agent economies via targeted incentives.
        </li>
        <li>
          <Text strong>Boosting rewards of devs</Text> by making a donation to a service here:
          <Link href="/donate">https://govern.olas.network/donate</Link>.
        </li>
      </ul>
    </Paragraph>
    <Paragraph>
      Govern is the main hub for all governance activity, from shaping incentives to influencing the
      broader direction of the Olas ecosystem.
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
          <Text strong>OLAS Emissions:</Text> Direct OLAS emissions to staking contracts.
        </li>
        <li className="mb-8">
          <Text strong>veOLAS Voting:</Text> Allocate voting weights using veOLAS.
        </li>
        <li className="mb-8">
          <Text strong>Staking Contracts:</Text> Smart contracts eligible to receive OLAS emissions.
        </li>
        <li className="mb-8">
          <Text strong>Voting Weights:</Text> Members allocate their{' '}
          <Text strong>total veOLAS balance</Text> across multiple staking contracts. For each
          voting epoch, <Text strong>100% of a member&apos;s veOLAS is used</Text>, and members
          decide how to split it. For example, 1% to Contract A, 5% to Contract B, 94% to Contract
          C. Voting weights are expressed as percentages of the total veOLAS balance.
        </li>
        <li className="mb-8">
          <Text strong>Epoch Voting:</Text> Votes for staking contracts are locked for 10 days and
          applied on the upcoming Thursday.
        </li>
        <li className="mb-8">
          <Text strong>Dev Rewards:</Text> Developer rewards are distributed through a
          protocol-native mechanism using NFTs to represent code contributions (agents and
          components). When these NFTs are referenced in deployed services that receive ETH
          donations, developers earn a proportional share of those ETH rewards.
        </li>
        <li className="mb-8">
          <Text strong>OLAS Boost:</Text> If a service receives ETH donations and its owner or
          donator holds enough veOLAS, the service can be whitelisted, allowing additional OLAS
          token top-ups to be minted and distributed to the contributing NFTs (agents and
          components). <Text strong>Note:</Text> OLAS Boost is currently disabled following the most
          recent{' '}
          <Link href="/proposals?proposalId=36930580870656423260851724498357663740745531652337761383184341922052946161388">
            governance vote
          </Link>
          .
        </li>
        <li className="mb-8">
          <Text strong>DAO Control:</Text> The DAO governs both the share of ETH donations allocated
          to reward code and the protocol share (currently set to zero) and the portion of OLAS
          inflation used for reward top-ups (currently{' '}
          <Link href="/proposals?proposalId=36930580870656423260851724498357663740745531652337761383184341922052946161388">
            set to zero
          </Link>
          ).The DAO governs three key parameters:
          <ul>
            <li>the share of ETH donations allocated to reward code,</li>
            <li>
              the share of ETH donations allocated, currently set to zero, and, the portion of OLAS
              inflation used for reward top-ups, currently set to zero.
            </li>
          </ul>
        </li>
      </ul>
    </Paragraph>
  </>
);

const StepByStep = () => (
  <>
    <Title level={4} className="mt-0">
      Step-by-Step Guide: How to Direct OLAS Emissions
    </Title>
    <Paragraph>
      <ol>
        <li>Browse available staking contracts in the Govern app.</li>
        <li>Allocate your voting weights using veOLAS (up to 100% of your voting power).</li>
        <li>Submit your vote.</li>
        <li>Wait for the new tokenomics Epoch to start.</li>
        <li>
          Initiate claim for staking incentives. OLAS emissions are distributed based on accumulated
          weights.
        </li>
      </ol>
    </Paragraph>
  </>
);

const FAQ = () => (
  <>
    <Title level={3} className="mt-0">
      Troubleshooting / FAQs
    </Title>
    <Paragraph className="mb-8">
      <ul>
        <li className="mb-8">
          <Text strong>Can I vote multiple times per epoch?</Text> Yes, you can vote for multiple
          nominees, but you cannot repeatedly vote within 10 days. To adjust your prior vote, wait
          until 10 days have passed since your last vote.
        </li>
        <li className="mb-8">
          <Text strong>Why do I have zero voting power?</Text> You need active veOLAS to vote. You
          can lock OLAS for veOLAS here:{' '}
          <Link href="/veolas">https://govern.olas.network/veolas</Link>
        </li>
        <li className="mb-8">
          <Text strong>Can I use part of my voting power to vote?</Text> No. If a vote is submitted
          on only some contracts, the remaining percentage of voting power will be automatically
          allocated to the Rollover Pool.
        </li>
        <li className="mb-8">
          <Text strong>How are OLAS emissions distributed?</Text> Based on the total voting weight
          assigned to each staking contract. Here is an example:
          <ul>
            <li>We have Staking Contract A and Staking Contract B</li>
            <li>
              Voter 1 and 2 both with x veOLAS distributed as follows:
              <ul>
                <li>
                  Voter 1 using 90% for <Text strong>Contract A</Text>, 10% retained
                </li>
                <li>
                  Voter 2 using 50% for <Text strong>Contract B</Text>, 50% retained
                </li>
              </ul>
            </li>
            <li>
              Then, the total aggregation of votes is as follows
              <ul>
                <li>
                  <Text strong>Contract A Votes:</Text> 90x/2x = 45
                </li>
                <li>
                  <Text strong>Contract B Votes:</Text> 50x/2x = 25
                </li>
                <li>
                  <Text strong>Retained Amount:</Text> 60x/2x = 30
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </Paragraph>
  </>
);

const Feedback = () => (
  <>
    <Title level={3} className="mt-0">
      Contributing / Feedback
    </Title>
    <Paragraph>
      Found outdated information or a typo? Submit issues or suggestions on{' '}
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

const LearnMore = () => (
  <>
    <Title level={4} className="mt-0">
      Learn More
    </Title>
    <Paragraph>
      <ul>
        <li>
          Direct the future of Olas:{' '}
          <Link href="https://olas.network/govern">https://olas.network/govern</Link>
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
        <WhatIsOlasGovern />
        <Divider style={DIVIDER_STYLE} />
        <CoreConcepts />
        <Divider style={DIVIDER_STYLE} />
        <StepByStep />
        <Divider style={DIVIDER_STYLE} />
        <FAQ />
        <Divider style={DIVIDER_STYLE} />
        <Feedback />
        <Divider style={DIVIDER_STYLE} />
        <LearnMore />
      </Content>
    </ContentWrapper>
  </>
);
