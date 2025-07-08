import { Typography, Row, Col, Spin } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';
import Markdown from 'markdown-to-jsx';

import { useFetchPathData } from 'common-util/hooks/useFetchPathData';
import { COLOR } from '@autonolas/frontend-library';
import Meta from 'components/Meta';

const Container = styled.div`
  padding: 0 32px;
`;

const Upcase = styled(Typography.Text)`
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.07em;
`;

const markdownOptions = {
  overrides: {
    a: {
      props: {
        target: '_blank',
      },
    },
  },
};

const PathDetailPage = () => {
  const { pathData, loading, markdownContent } = useFetchPathData();

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin />
        </div>
      </Container>
    );
  }

  if (!pathData) {
    return (
      <Container>
        <Typography.Title level={2}>Path not found</Typography.Title>
      </Container>
    );
  }

  return (
    <>
      <Meta
        title={pathData.name}
        description={pathData.description}
        path={`paths/${pathData.id}`}
      />
      <Container>
        <Typography.Title className="mt-0 mb-16" level={1}>
          {pathData.name}
        </Typography.Title>
        <Row gutter={[48, 48]}>
          <Col xs={24} lg={12}>
            <Typography.Title className="mt-0 mb-8" level={4}>
              Path
            </Typography.Title>
            {markdownContent && (
              <Markdown style={{ lineHeight: '1.4' }} options={markdownOptions}>
                {markdownContent}
              </Markdown>
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
                    src={pathData.images?.description ?? `/images/${pathData.id}.png`}
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
            {pathData.service && (
              <section className="mb-16" id="service">
                <div className="mb-8">
                  <Upcase>Service</Upcase>
                </div>
                <Row gutter={[16, 16]} align="middle" style={{ maxWidth: '500px' }}>
                  <Col span={8}>
                    <Image
                      src={
                        pathData.images?.service ?? `/images/services/${pathData?.service?.id}.png`
                      }
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
                      This tool contributes to the{' '}
                      <a href={pathData.service.url} target="_blank" rel="noopener noreferrer">
                        {pathData.service.name}
                        &nbsp;↗
                      </a>{' '}
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
                <Row gutter={[16, 16]} align="middle" style={{ maxWidth: '500px' }}>
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
                      This path is for building a Mech tool. Mechs is a marketplace for agents to
                      easily use AI tools via a blockchain.
                    </Typography.Paragraph>
                  </Col>
                </Row>
              </section>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default PathDetailPage;
