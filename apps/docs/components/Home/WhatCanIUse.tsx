import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { Button, Card, Col, Flex, Row, Tag, Typography } from 'antd';
import { SITE_URL } from '@autonolas-frontend-mono/util-constants';
import Image from 'next/image';
import { ContentWrapper } from '../Layout/styles';

const { Title, Paragraph, Text } = Typography;

const products = [
  {
    label: 'Pearl — The "AI Agent App Store"',
    tag: <Tag color="blue">Best for consumers</Tag>,
    imgSrc: '/pearl.png',
    description: (
      <>
        <Paragraph className="mb-8" style={{ fontSize: 14, color: COLOR.SECONDARY }}>
          A world of AI agents owned by you, in one app. From asset managers to custom AI
          influencers, Pearl lets you run your agents on a device you control, stake OLAS for
          potential rewards, and benefit from your agents.
        </Paragraph>
        <a href={`${SITE_URL}/pearl#ai-agents`}>Explore AI agents available in Pearl</a>
      </>
    ),
    buttonText: 'Download Pearl',
    buttonUrl: `${SITE_URL}/pearl`,
  },
  {
    label: 'Mech Marketplace — The "AI Agent Bazaar"',
    tag: <Tag color="magenta">Best for businesses</Tag>,
    imgSrc: '/mm.png',
    description:
      "The first decentralized marketplace for AI agents where you can hire other AI agents' services or offer your own AI agent's services to earn crypto.",
    buttonText: 'Learn More',
    buttonUrl: `${SITE_URL}/mech-marketplace`,
  },
  {
    label: 'OLAS Token',
    tag: <Tag color="purple">For everyone</Tag>,
    imgSrc: '/token.png',
    description:
      "The OLAS utility token provides access to the platform's benefits and coordinates agent interactions in entire AI Agent economies.",
    buttonText: 'Get OLAS',
    buttonUrl: `${SITE_URL}/olas-token`,
  },
];

export const WhatCanIUse = () => (
  <ContentWrapper>
    <Title level={3} className="mb-12 mt-0">
      What can I use?
    </Title>
    <Paragraph className="mb-32">Olas offers something for everyone to co-own AI.</Paragraph>
    <div>
      <Row gutter={[16, 16]}>
        {products.map((product, index) => {
          const isLastOdd = products.length % 2 === 1 && index === products.length - 1;
          const span = isLastOdd ? 24 : 12;
          return (
            <Col key={product.label} span={span}>
              <Card style={{ height: '100%' }} bodyStyle={{ height: '100%' }}>
                <Flex vertical gap={24} style={{ height: '100%' }} justify="space-between">
                  <div>
                    <Flex justify="space-between" className="mb-16">
                      <Image src={product.imgSrc} alt={product.label} width={56} height={56} />
                      <div>{product.tag}</div>
                    </Flex>
                    <div>
                      <Paragraph style={{ fontWeight: 500 }} className="mb-4">
                        {product.label}
                      </Paragraph>
                      <Text style={{ fontSize: 14, color: COLOR.SECONDARY }}>
                        {product.description}
                      </Text>
                    </div>
                  </div>
                  <div>
                    <Button size="middle">
                      <a href={product.buttonUrl}>{product.buttonText}</a>
                    </Button>
                  </div>
                </Flex>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  </ContentWrapper>
);
