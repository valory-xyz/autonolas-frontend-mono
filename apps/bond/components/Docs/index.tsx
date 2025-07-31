import { Divider, Flex, Typography } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
import { BOND_URL, SITE_URL } from 'libs/util-constants/src';
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
      <Text strong>OLAS bonding</Text> allows participants to provide liquidity to the Olas
      ecosystem in exchange for OLAS tokens. This mechanism helps the protocol grow liquidity in
      OLAS sustainably through <Text strong>protocol-owned liquidity (POL)</Text> — strengthening
      long-term stability for the Olas ecosystem.
    </Paragraph>
  </>
);

const QuickStart = () => (
  <>
    <Title level={4} className="mt-0">
      Quick Start
    </Title>
    <Paragraph>
      <Text strong>Get started with OLAS bonding:</Text> <Link href="/">{BOND_URL}</Link>
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
          <Text strong>OLAS Bonding</Text> — Provide liquidity in exchange for discounted OLAS
          tokens.
        </li>
        <li className="mb-8">
          <Text strong>Protocol-Owned Liquidity (POL)</Text> — Liquidity owned by the protocol,
          supporting sustainability.
        </li>
        <li className="mb-8">
          <Text strong>Bonding Products</Text> — Available bonding opportunities offering OLAS at a
          fixed rate.
        </li>
      </ul>
    </Paragraph>

    <Paragraph>
      OLAS bonding lets users exchange assets (like DAI or LP tokens) for OLAS at a fixed bond
      price, which may differ from the market price.
      <ul>
        <li className="mb-8">
          <Text strong>Discount:</Text> When the bond price is <Text strong>below</Text> market
          price, users get more OLAS — making bonding attractive.
        </li>
        <li className="mb-8">
          <Text strong>Premium:</Text> When the bond price is <Text strong>above</Text> market
          price, users get less OLAS — making bonding less favorable.
        </li>
      </ul>
    </Paragraph>

    <Paragraph>
      Whether a bond is at a discount or premium depends on market conditions and bonding
      parameters.
      <ul>
        <li className="mb-8">
          <Text strong>Vesting Period</Text> — Time before you can claim your OLAS after bonding.
        </li>
        <li className="mb-8">
          <Text strong>My Bonds Dashboard</Text> — Track your active bonds and claim vested OLAS.
        </li>
      </ul>
    </Paragraph>
  </>
);

const StepByStep = () => (
  <>
    <Title level={4} className="mt-0">
      Step-by-Step Guide
    </Title>
    <Title level={3} className="mt-0 mb-0">
      How to Bond OLAS
    </Title>

    <ol>
      <li className="mb-8">
        Visit <Link href="/">{BOND_URL}</Link>.
      </li>
      <li className="mb-8">Choose a liquidity pair to bond (e.g., OLAS/wxDAI).</li>
      <li className="mb-8">
        Follow the specific bonding path (e.g.,{' '}
        <Link href="/paths/olas-wxdai-via-balancer-on-gnosis-chain">
          OLAS/wxDAI via Balancer on Gnosis
        </Link>
        ), which includes:
        <ol type="a">
          <li className="mb-8">Selecting a profitable bonding program.</li>
          <li className="mb-8">
            Depositing assets into the specified LP pool (e.g., on Balancer).
          </li>
          <li className="mb-8">
            Bridging your LP tokens to Ethereum using the indicated bridge (e.g., OmniBridge).
          </li>
          <li className="mb-8">
            Depositing the bridged LP tokens into the selected bonding product at{' '}
            <Link href="/bonding-products">{BOND_URL}/bonding-products</Link>.
          </li>
          <li>
            Once bonded, your LP tokens are owned by the Olas protocol, and you will receive the
            quoted amount of OLAS at the end of the vesting period.
          </li>
        </ol>
      </li>
      <li className="mb-8">Track your bonds in the &quot;My Bonds&quot; section.</li>
      <li>Withdraw your OLAS once the vesting period is complete.</li>
    </ol>

    <Title level={3} className="mt-0 mb-0">
      How to Track and Withdraw
    </Title>

    <ol>
      <li className="mb-8">
        Track your active bonds in the <Text strong>My Bonds</Text> section on{' '}
        <Link href="/">{BOND_URL}</Link>.
      </li>
      <li>
        After the vesting period ends, you can <Text strong>claim your OLAS</Text> directly from the
        dashboard.
      </li>
    </ol>
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
          <Text strong>Bonding products are NOT always profitable</Text> - bonding products offer a
          fixed exchange rate between the LP token and OLAS. Depending on market conditions, it
          might not be worthwhile bonding.
        </li>
        <li className="mb-8">
          <Text strong>Use the correct platforms</Text> — Always follow the bonding guide and use
          the listed DEXs and bridges. Incorrect platforms may result in ineligible bonds.
        </li>
        <li className="mb-8">
          <Text strong>Double-check bonding steps</Text> — Carefully follow instructions before
          bridging or providing liquidity.
        </li>
        <li className="mb-8">
          <Text strong>Verify network and tokens</Text> — Ensure you are on the correct chain (for
          example, Gnosis or Ethereum) and using the correct token addresses.
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
    <ul>
      <li>
        Learn about OLAS <Link href={`${SITE_URL}/olas-token`}>Tokenomics</Link>.
      </li>
    </ul>
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
