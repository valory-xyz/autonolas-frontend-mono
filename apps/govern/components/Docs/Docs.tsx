import { Divider, Flex, Tag, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

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
      The Olas Govern app is a web application designed for Olas DAO members to streamline
      governance operations. Its core functionality comes down to two main features:
    </Paragraph>
    <ul className="m-0">
      <li className="mb-8">
        It allows to direct OLAS token emissions to desirable staking programs via a voting-weight
        mechanism.
      </li>
      <li>It provides access to Olas DAO proposals.</li>
    </ul>
  </>
);

const DirectOlasEmissions = () => (
  <>
    <Title level={4} className="mt-0">
      Direct OLAS token emissions to desirable staking contracts
    </Title>
    <Paragraph>
      Olas Govern provides a user-centered interface that allows Olas DAO members to bootstrap
      autonomous services at scale through targeted OLAS emissions. In other words, Olas Govern
      enables the full power of the Proof-of-Active-Agent (PoAA) mechanism in the context of Olas
      Staking. You can learn more about Olas Staking and PoAA mechanism in the{' '}
      <a href="https://staking.olas.network/poaa-whitepaper.pdf" target="_blank">
        official whitepaper {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
      .
    </Paragraph>
    <Paragraph className="mb-0">
      Here are three simple steps that explain how governors can use Olas Govern to direct OLAS
      emissions to different staking contracts.
    </Paragraph>
  </>
);

const Step1 = () => (
  <>
    <figure className="m-0 mb-24">
      <Image
        src={'/images/docs/step1.png'}
        width={CONTENT_MAX_WIDTH}
        height={280}
        alt="Fig 1"
        className="mb-12"
      />
      <figcaption className="text-center">
        <Text type="secondary">
          Fig 1. Govern app supports different parts of the Olas agent economy
        </Text>
      </figcaption>
    </figure>
    <Tag style={TAG_STYLE}>Step 1</Tag>
    <Title level={4} className="mt-16">
      Support different parts of the Olas agent economy
    </Title>
    <Paragraph>
      Governors can vote for staking contracts created by launchers. This will direct OLAS token
      emissions coming from the Olas protocol to the desired staking contracts.
    </Paragraph>
    <Paragraph>
      Agent operators can earn staking rewards by operating active agents within agent economies
      participating in the staking programs.
    </Paragraph>
    <Paragraph>
      Agents stake OLAS on the most popular staking contracts, which incentivize them to do work.
      Their work produces services.
    </Paragraph>
    <Paragraph className="mb-0">
      On the other hand, developers will face more demand for their code contributions, whether
      creating new components or composing existing and new ones into new services.
    </Paragraph>
  </>
);

const Step2 = () => (
  <>
    <figure className="m-0 mb-24">
      <Image
        src={'/images/docs/step2.png'}
        width={CONTENT_MAX_WIDTH}
        height={292}
        alt="Fig 2"
        className="mb-12"
      />
      <figcaption className="text-center">
        <Text type="secondary">
          Fig 2. Allocating voting power directs OLAS emissions to different staking contracts
        </Text>
      </figcaption>
    </figure>
    <Tag style={TAG_STYLE}>Step 2</Tag>
    <Title level={4} className="mt-16">
      Allocate your voting power to different staking contracts
    </Title>
    <Paragraph>
      DAO members have the ability to assign weights with their veOLAS to one or more staking
      programs, with the sum of weights capped at 1.
    </Paragraph>
    <Paragraph className="mb-0">
      Each member can assign weights only once per epoch and, once voted, these weights remain
      unchanged for subsequent epochs until their veOLAS holding is depleted or they modify their
      vote. To update previous weights, DAO members can cast a new vote.
    </Paragraph>
  </>
);

const Step3 = () => (
  <>
    <figure className="m-0 mb-24">
      <Image
        src={'/images/docs/step3.png'}
        width={CONTENT_MAX_WIDTH}
        height={316}
        alt="Fig 3"
        className="mb-12"
      />
      <figcaption className="text-center">
        <Text type="secondary">Fig 3. Allocate your voting power with the Olas Govern app</Text>
      </figcaption>
    </figure>
    <Tag style={TAG_STYLE}>Step 3</Tag>
    <Title level={4} className="mt-16">
      Browse contracts, add them to your list and set your vote weights
    </Title>
    <Paragraph className="mb-0">
      Staking contracts are allocated a fraction of newly minted OLAS for staking in proportion to
      the accumulated weights. Staking contracts with the biggest voting weight attract more agents,
      produce more services, and grow faster.
    </Paragraph>
  </>
);

const Proposals = () => (
  <>
    <Title level={3} className="mt-0">
      Olas DAO proposals
    </Title>
    <Paragraph className="mb-8">
      Olas Govern is the central hub for Olas DAO members and provides access to DAO proposals.
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
        <DirectOlasEmissions />
        <Divider style={DIVIDER_STYLE} />
        <Step1 />
        <Divider style={DIVIDER_STYLE} />
        <Step2 />
        <Divider style={DIVIDER_STYLE} />
        <Step3 />
        <Divider style={DIVIDER_STYLE} />
        <Proposals />
      </Content>
    </ContentWrapper>
  </>
);
