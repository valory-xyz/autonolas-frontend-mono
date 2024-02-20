import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Typography, Spin, Row, Col,
} from 'antd';
import Image from 'next/image';
import styled from 'styled-components';
import Markdown from 'markdown-to-jsx';

import paths from 'components/Paths/data.json';
import { COLOR } from '@autonolas/frontend-library';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const Upcase = styled(Typography.Text)`
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.07em;
`;

const PathDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    const fetchMarkdown = async () => {
      if (pathData?.markdownPath) {
        try {
          const response = await fetch(`/${pathData.markdownPath}`);
          const text = await response.text();
          setMarkdownContent(text);
        } catch (error) {
          console.error('Error fetching markdown:', error);
        }
      }
    };
    fetchMarkdown();
  }, [pathData]);

  useEffect(() => {
    if (id) {
      const path = paths.find((p) => p.id === id);
      if (path) {
        setPathData(path);
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  if (!pathData) {
    return <Typography.Title level={2}>Path not found</Typography.Title>;
  }

  return (
    <>
      <Typography.Title className="mt-0 mb-16" level={3}>
        {pathData.name}
      </Typography.Title>
      <Row gutter={[48, 48]}>
        <Col xs={24} lg={12}>
          <Typography.Title className="mt-0 mb-8" level={4}>
            Path
          </Typography.Title>
          {markdownContent && (
            <Markdown style={{ lineHeight: '1.4' }}>{markdownContent}</Markdown>
          )}
        </Col>
        <Col xs={24} md={12}>
          <Typography.Title className="mt-0 mb-8" level={4}>
            About this path
          </Typography.Title>
          <section className="mb-16" id="description">
            <div className="mb-8">
              <Upcase>Description</Upcase>
            </div>
            <Row gutter={[16, 16]} align="middle" style={{ maxWidth: '500px' }}>
              <Col span={8}>
                <Image
                  src={`/images/${id}.png`}
                  alt={pathData.name}
                  width={200}
                  height={200}
                  layout="intrinsic"
                  style={{
                    borderRadius: '5px',
                    border: `1px solid ${COLOR.BORDER_GREY}`,
                  }}
                />
              </Col>
              <Col span={16}>
                <Typography.Paragraph>
                  {pathData.description}
                </Typography.Paragraph>
              </Col>
            </Row>
          </section>
          {pathData.service && (
            <section className="mb-16" id="service">
              <div className="mb-8">
                <Upcase>Service</Upcase>
              </div>
              <Row
                gutter={[16, 16]}
                align="middle"
                style={{ maxWidth: '500px' }}
              >
                <Col span={8}>
                  <Image
                    src={`/images/services/${pathData?.service?.id}.png`}
                    alt={pathData.service.name}
                    width={200}
                    height={200}
                    layout="intrinsic"
                    style={{
                      borderRadius: '5px',
                      border: `1px solid ${COLOR.BORDER_GREY}`,
                    }}
                  />
                </Col>
                <Col span={16}>
                  <Typography.Paragraph>
                    This tool contributes to the
                    {' '}
                    <a
                      href={pathData.service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pathData.service.name}
                      &nbsp;↗
                    </a>
                    {' '}
                    service.
                  </Typography.Paragraph>
                </Col>
              </Row>
            </section>
          )}
          <section className="mb-16" id="rewards">
            <div className="mb-8">
              <Upcase>Rewards</Upcase>
            </div>
            <Row gutter={[16, 16]} align="middle" style={{ maxWidth: '500px' }}>
              <Col span={8}>
                <Image
                  src="/images/rewards.png"
                  alt="Eligible for Olas Build Rewards"
                  width={200}
                  height={200}
                  layout="intrinsic"
                  style={{
                    borderRadius: '5px',
                    border: `1px solid ${COLOR.BORDER_GREY}`,
                  }}
                />
              </Col>
              <Col span={16}>
                <Typography.Paragraph>
                  Completing this path will make you eligible for Build Rewards.
                </Typography.Paragraph>
              </Col>
            </Row>
          </section>
          {pathData.isMechsToolPath && (
            <section className="mb-16" id="is-mechs-tool-path">
              <div className="mb-8">
                <Upcase>Mechs Tool</Upcase>
              </div>
              <Row
                gutter={[16, 16]}
                align="middle"
                style={{ maxWidth: '500px' }}
              >
                <Col span={8}>
                  <Image
                    src="/images/mechs.png"
                    alt="Eligible for Olas Build Rewards"
                    width={200}
                    height={200}
                    layout="intrinsic"
                    style={{
                      borderRadius: '5px',
                      border: `1px solid ${COLOR.BORDER_GREY}`,
                    }}
                  />
                </Col>
                <Col span={16}>
                  <Typography.Paragraph>
                    This path is for building a Mechs tool. Mechs is a
                    marketplace for agents to easily use AI tools via a
                    blockchain.
                  </Typography.Paragraph>
                </Col>
              </Row>
            </section>
          )}
        </Col>
      </Row>
    </>
  );
};

export default PathDetailPage;
