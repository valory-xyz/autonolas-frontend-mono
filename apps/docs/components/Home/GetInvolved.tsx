import Link from 'next/link';
import { Col, Flex, Row, Typography } from 'antd';
import Image from 'next/image';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { SITE_URL } from '@autonolas-frontend-mono/util-constants';
import { BackgroundOverlay, GetInvolvedBg, GetInvolvedCard } from '../Layout/styles';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

type InvolvedItem = {
  imageSrc: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  imageWidth?: number;
  imageHeight?: number;
};

const ImageContainer = styled.div`
  padding: 24px;
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
  aspect-ratio: 840 / 543;
`;

const GET_INVOLVED_DATA: InvolvedItem[] = [
  {
    imageSrc: '/olas-contribute.png',
    title: 'Grow awareness about Olas',
    description: 'Promote Olas on X and earn points while doing so.',
    ctaText: 'Contribute',
    href: `${SITE_URL}/contribute`,
  },
  {
    imageSrc: '/olas-launch.png',
    title: 'Launch your own agent economy, boost DAAs',
    description: 'Everything you need to launch an AI agent economy on your chain/protocol.',
    ctaText: 'Launch',
    href: `${SITE_URL}/launch`,
  },
  {
    imageSrc: '/olas-build.png',
    title: 'Build agents, get rewarded',
    description:
      'A permissionless developer rewards mechanism incentivises useful code contributions.',
    ctaText: 'Build',
    href: `${SITE_URL}/build`,
  },
  {
    imageSrc: '/olas-govern.png',
    title: 'Direct the future of Olas',
    description: 'Join the decision-making process that drives growth in the Olas ecosystem.',
    ctaText: 'Govern',
    href: `${SITE_URL}/govern`,
  },
  {
    imageSrc: '/olas-bond.png',
    title: 'Provide liquidity, get discounted OLAS',
    description: 'A bonding mechanism rewards providers of liquidity with discounted OLAS.',
    ctaText: 'Bond',
    href: `${SITE_URL}/bond`,
  },
  {
    imageSrc: '/olas-operate.png',
    title: 'Run agents, stake & earn rewards',
    description: 'A unique staking mechanism rewards active agents for their useful contributions.',
    ctaText: 'Operate',
    href: `${SITE_URL}/operate`,
  },
];

const ContentCard = ({ imageSrc, title, description, ctaText, href }: InvolvedItem) => (
  <Link href={href} style={{ textDecoration: 'none' }}>
    <GetInvolvedCard>
      <Flex vertical style={{ height: '100%' }} justify="space-between">
        <div>
          {imageSrc && title && (
            <div style={{ width: '100%', minHeight: 85, position: 'relative' }}>
              <Image src={imageSrc} alt={ctaText} fill style={{ objectFit: 'fill' }} />
            </div>
          )}
          {ctaText && (
            <Text strong style={{ color: COLOR.PRIMARY }}>
              {ctaText}
            </Text>
          )}
          {title && (
            <Paragraph style={{ fontSize: 20, fontWeight: 600, margin: '12px 0' }}>
              {title}
            </Paragraph>
          )}
          {description && <Text style={{ color: COLOR.SECONDARY }}>{description}</Text>}
        </div>
      </Flex>
    </GetInvolvedCard>
  </Link>
);

export const GetInvolved = () => (
  <GetInvolvedBg>
    <BackgroundOverlay />
    <div style={{ maxWidth: 1256, margin: 'auto' }}>
      <div style={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
        <Title level={3} className="mb-12">
          Get Involved in Growing Olas
        </Title>
        <Paragraph className="mb-12">
          Choose a role and benefit from the Olas protocol, no matter what you bring to the table.
        </Paragraph>
      </div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <ImageContainer>
            <Image src="/roles-diagram.png" alt="Get involved" fill style={{ objectFit: 'fill' }} />
          </ImageContainer>
        </Col>
        {GET_INVOLVED_DATA.map((item, index) => (
          <Col key={index} xs={24} md={12} lg={8}>
            <ContentCard {...item} />
          </Col>
        ))}
      </Row>
    </div>
  </GetInvolvedBg>
);
