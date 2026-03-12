import { Col, Flex, Row, Typography } from 'antd';
import {
  DISCORD_INVITE_URL,
  SITE_URL,
  X_URL,
  YOUTUBE_URL,
} from '@autonolas-frontend-mono/util-constants';
import { ContentWrapper, DocsCard } from '../Layout/styles';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import Image from 'next/image';

const { Title, Text } = Typography;

const socials = [
  {
    label: 'X',
    description: 'Latest product news and updates.',
    imgSrc: '/X.png',
    link: X_URL,
  },
  {
    label: 'Discord',
    description: 'Ask, share, and build with others.',
    imgSrc: '/discord.png',
    link: DISCORD_INVITE_URL,
  },
  {
    label: 'Blog',
    description: 'Important ecosystem updates.',
    imgSrc: '/blog.png',
    link: `${SITE_URL}/blog`,
  },
  {
    label: 'Youtube',
    description: 'Watch Olas related content.',
    imgSrc: '/youtube.png',
    link: YOUTUBE_URL,
  },
];

export const StayInTouch = () => (
  <ContentWrapper>
    <Title level={3} className="mb-32 mt-0">
      Stay in Touch with the Olas Community
    </Title>
    <Row gutter={[16, 16]}>
      {socials.map((item, index) => {
        return (
          <Col key={index} span={12}>
            <a href={item.link}>
              <DocsCard styles={{ body: { padding: 16 } }}>
                <Flex gap={16} align="center">
                  <Image src={item.imgSrc} alt={item.label} width={40} height={40} />
                  <div>
                    <Text className="mb-4" style={{ fontWeight: 500 }}>
                      {item.label}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 14, color: COLOR.SECONDARY }}>{item.description}</Text>
                  </div>
                </Flex>
              </DocsCard>
            </a>
          </Col>
        );
      })}
    </Row>
  </ContentWrapper>
);
