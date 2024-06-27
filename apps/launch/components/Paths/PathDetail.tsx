import { Col, Row, Spin, Typography } from 'antd';
import Markdown from 'markdown-to-jsx';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import { PATHS, Path } from 'common-util/constants/paths';

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

export const PathDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [pathData, setPathData] = useState<Path | null>(null);
  const [loading, setLoading] = useState(true);
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        const response = await fetch(`/paths-markdown/${id}.md`);
        const text = await response.text();
        setMarkdownContent(text);
      } catch (error) {
        console.error('Error fetching markdown:', error);
      }
    };
    fetchMarkdown();
  }, [pathData]);

  useEffect(() => {
    if (id) {
      const path = PATHS.find((path) => path.id === id);
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
          {markdownContent && <Markdown style={{ lineHeight: '1.4' }}>{markdownContent}</Markdown>}
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
                  src={`/images/paths/${id}.png`}
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
                <Typography.Paragraph>{pathData.description}</Typography.Paragraph>
              </Col>
            </Row>
          </section>
        </Col>
      </Row>
    </>
  );
};
