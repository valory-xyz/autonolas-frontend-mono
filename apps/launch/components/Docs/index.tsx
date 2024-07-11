import { Divider, Flex, Tag, Typography } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { PATHS, YOUR_OWN_PATH } from 'common-util/constants/paths';

const { Paragraph, Title, Text } = Typography;

const HERO_MAX_WIDTH = 1312;
const CONTENT_MAX_WIDTH = 720;

const DIVIDER_STYLE = { margin: '40px 0' };
const TAG_STYLE = { width: 'max-content' };

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

const MyStakingContracts = () => (
  <>
    <Title level={3}>My staking contracts</Title>
    <Paragraph className="mb-8">
      The Olas Launch app allows anyone to launch staking contracts. Staking contracts implement the
      mechanism to reward agents actively working towards KPIs. You can learn more about the
      mechanism in the{' '}
      <a href="https://staking.olas.network/poaa-whitepaper.pdf" target="_blank">
        official whitepaper {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
      .
    </Paragraph>
    <Text>The core functionality of the Launch app includes:</Text>
    <ul>
      <li className="mb-8">Create staking contracts on supported chains.</li>
      <li className="mb-8">
        Nominate staking contracts to make them eligible to receive incentives from the Olas
        protocol.
      </li>
      <li>Track staking contract performance.</li>
    </ul>
    <Paragraph className="mb-0">
      Here are three simple steps that explain how to create staking contracts and get agents to do
      any kind of work defined by your KPIs.
    </Paragraph>
  </>
);

const Step1 = () => (
  <>
    <Tag style={TAG_STYLE}>Step 1</Tag>
    <Title level={4} className="mt-16">
      Support different parts of the Olas agent economy
    </Title>
    <Paragraph>
      The Launch app allows anyone (from individuals to companies or other DAOs) to commission agent
      activity aligned with their goals, defining success via KPIs, and have a chance at attracting
      incentives from the Olas protocol.
    </Paragraph>
    <Paragraph>
      Any user can create a staking contract based on specific configurations, known as templates.
    </Paragraph>
    <Paragraph>
      The flexibility of staking contracts lies in the variability of their activity check, which
      can be customized to suit the specific requirements of different agents and agent economies.
      For instance, for the prediction Trader, activity can be determined by the number of Mech
      requests made on-chain, while for the Market Creator agent, activity could be assessed based
      on the number of markets created within a given timeframe.
    </Paragraph>
    <Paragraph className="mb-0">
      Staking contracts can only be configured during deployment, implying immutability once
      initialized.
    </Paragraph>
  </>
);

const Step2 = () => (
  <>
    <figure className="m-0 mb-24">
      <Image
        src={'/images/docs/step2.png'}
        width={CONTENT_MAX_WIDTH}
        height={140}
        alt="Fig 2"
        className="mb-12"
      />
      <figcaption className="text-center">
        <Text type="secondary">
          Fig 2. Nomination makes the staking contract eligible to receive incentives from the Olas
          protocol.
        </Text>
      </figcaption>
    </figure>
    <Tag style={TAG_STYLE}>Step 2</Tag>
    <Title level={4} className="mt-16">
      Nominate contract for voting
    </Title>
    <Paragraph>
      Each staking contract should be added to the voting process on Govern to make it eligible for
      staking incentives from the Olas protocol. This process is called nomination, and it allows
      the Olas DAO to bootstrap agent economies at scale through targeted OLAS emissions.
    </Paragraph>
  </>
);

const Step3 = () => (
  <>
    <figure className="m-0 mb-24">
      <Image
        src={'/images/docs/step3.png'}
        width={CONTENT_MAX_WIDTH}
        height={384}
        alt="Fig 2"
        className="mb-12"
      />
      <figcaption className="text-center">
        <Text type="secondary">
          Fig 3. Promotion increases your chances to get more OLAS emissions directed by DAO members
          and attract more agents working towards the contract's KPIs.
        </Text>
      </figcaption>
    </figure>
    <Tag style={TAG_STYLE}>Step 3</Tag>
    <Title level={4} className="mt-16">
      Promote contract to community
    </Title>
    <Paragraph className="mb-0">
      After successful nomination, you should promote your staking contracts to veOLAS holders.
      veOLAS holders then vote for the most promising staking contracts, making them attractive to
      agents and operators. The more voting weight your contract has, the more rewards it receives,
      and the more agents will be incentivized to fulfil your activity goals.
    </Paragraph>
  </>
);

const Paths = () => (
  <>
    <Title level={3} className="mt-0">
      Paths overview
    </Title>
    <Paragraph className="mb-8">
      Launching staking contracts is not the only possibility to benefit from the Olas protocol.
      Here are more paths you can follow as a Launcher:
    </Paragraph>
    <ul>
      {PATHS.map((path) => (
        <li key={path.id} className="mb-8">
          <Link href={`/paths/${path.id}`}>{path.name}</Link>
          <br />
          {path.description}
        </li>
      ))}
      <li>
        <a
          href={YOUR_OWN_PATH.link}
          target="_blank"
        >{`${YOUR_OWN_PATH.name} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}</a>
        <br />
        {YOUR_OWN_PATH.description}
      </li>
    </ul>
  </>
);

export const DocsPage = () => (
  <>
    <HeroSection />
    <ContentWrapper>
      <Content>
        <MyStakingContracts />
        <Divider style={DIVIDER_STYLE} />
        <Step1 />
        <Divider style={DIVIDER_STYLE} />
        <Step2 />
        <Divider style={DIVIDER_STYLE} />
        <Step3 />
        <Divider style={DIVIDER_STYLE} />
        <Paths />
      </Content>
    </ContentWrapper>
  </>
);
