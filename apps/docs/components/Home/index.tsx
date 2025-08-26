import { Divider, Flex, Typography } from 'antd';
import {
  BOND_SITE_URL,
  BUILD_SITE_URL,
  CONTRIBUTE_SITE_URL,
  DISCORD_INVITE_URL,
  GOVERN_SITE_URL,
  LAUNCH_SITE_URL,
  OLAS_SITE_URL,
  OPERATE_SITE_URL,
  X_URL,
  YOUTUBE_URL,
} from 'apps/docs/util/constants';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import styled from 'styled-components';
import Meta from '../Meta';

const { Paragraph, Title, Text } = Typography;

const CONTENT_MAX_WIDTH = 720;

const DIVIDER_STYLE = { margin: '20px 0' };

const Hero = styled.div`
  display: flex;
  flex-direction: column;
  max-width: auto;
  margin: 0 auto;
  background: #f2f4f9;
`;

const ContentWrapper = styled.div`
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
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
      <Title className="m-0 mt-24">Welcome to Olas Docs</Title>
    </Flex>
  </Hero>
);

const Intro = () => (
  <>
    <Paragraph className="mb-8 mt-24">
      This documentation will guide you through what Olas is, what you can build and use, and how to
      get involved based on your role.
    </Paragraph>
  </>
);

const WhatIsOlas = () => (
  <>
    <Title level={4} className="mb-16">
      What is Olas?
    </Title>
    <Paragraph>Olas is the platform that enables true co-ownership of AI.</Paragraph>
    <Paragraph>
      <div className="mb-12">Understand the mission, vision, and roadmap of Olas.</div>
      <ul>
        <li>
          <a href={`${OLAS_SITE_URL}/about`}>About Olas</a>
        </li>
        <li>
          <a href={`${OLAS_SITE_URL}/roadmap`}>Roadmap</a>
        </li>
      </ul>
    </Paragraph>
  </>
);

const WhatCanIUse = () => (
  <>
    <Title level={4} className="mb-16">
      What can I use?
    </Title>
    <Paragraph>
      <ul>
        <li>
          <a href={`${OLAS_SITE_URL}/pearl`}>Pearl (AI Agent App Store)</a>
          <div className="mb-8">
            A world of AI agents owned by you, in one app. From asset managers to custom AI
            influencers, Pearl lets you run your agents on a device you control, stake OLAS for
            potential rewards, and benefit from your agents. The list of agents available in Pearl
            can be found <a href={`${OLAS_SITE_URL}/agents`}>here</a>.
          </div>
        </li>
        <li>
          <a href={`${OLAS_SITE_URL}/mech-marketplace`}>Mech Marketplace (AI Agent Bazaar)</a>
          <div className="mb-8">
            The first decentralized marketplace where you can hire or offer AI agent services.
          </div>
        </li>
        <li>
          <a href={`${OLAS_SITE_URL}/olas-token`}>Olas Token</a>
          <div>OLAS token provides access to the core functions of the Olas network.</div>
        </li>
      </ul>
    </Paragraph>
  </>
);

const HowCanIGetInvolved = () => (
  <>
    <Title level={4} className="mb-16">
      How can I get involved?
    </Title>
    <Paragraph>
      <div className="mb-12">
        For those who want to shape the DAO, find tailored guides based on your role in the
        ecosystem.
      </div>
      <ul>
        <li>
          <a href={BUILD_SITE_URL}>Builders</a>
        </li>
        <li>
          <a href={CONTRIBUTE_SITE_URL}>Contributors</a>
        </li>
        <li>
          <a href={OPERATE_SITE_URL}>Operators</a>
        </li>
        <li>
          <a href={BOND_SITE_URL}>Bonders</a>
        </li>
        <li>
          <a href={GOVERN_SITE_URL}>Governors</a>
        </li>
        <li>
          <a href={LAUNCH_SITE_URL}>Launchers</a>
        </li>
      </ul>
    </Paragraph>
    <Paragraph>
      <div className="mb-12">
        <Text strong>Community and Communication</Text>
      </div>
      <ul>
        <li>
          <a href={X_URL} rel="noopener noreferrer" target="_blank">
            X
          </a>
        </li>
        <li>
          <a href={YOUTUBE_URL} rel="noopener noreferrer" target="_blank">
            Youtube
          </a>
        </li>
        <li>
          <a href={`${OLAS_SITE_URL}/blog`} rel="noopener noreferrer" target="_blank">
            Blog
          </a>
        </li>
        <li>
          <a href={DISCORD_INVITE_URL} rel="noopener noreferrer" target="_blank">
            Discord
          </a>
        </li>
      </ul>
    </Paragraph>
  </>
);

export const HomePage = () => (
  <>
    <Meta />
    <HeroSection />
    <ContentWrapper>
      <Content>
        <Intro />
        <Divider style={DIVIDER_STYLE} />
        <WhatIsOlas />
        <Divider style={DIVIDER_STYLE} />
        <WhatCanIUse />
        <Divider style={DIVIDER_STYLE} />
        <HowCanIGetInvolved />
      </Content>
    </ContentWrapper>
  </>
);
