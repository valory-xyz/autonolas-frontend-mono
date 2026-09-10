import { Typography, Row, Col } from 'antd';
import Markdown from 'markdown-to-jsx';
import { GetStaticPaths, GetStaticProps } from 'next';
import Image from 'next/image';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';
import { readPublicFile } from 'libs/util-ssr/src';

import Meta from 'components/Meta';
import paths from 'components/Paths/data.json';
import { PageWrapper } from 'util/theme';

type PathData = (typeof paths)[number];

type PathDetailProps = {
  pathData: PathData;
  markdownContent: string;
};

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

/** The six paths are a checked-in JSON file, so an unknown id is a 404, not a page to generate. */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: paths.map(({ id }) => ({ params: { id } })),
  fallback: false,
});

/**
 * The guide used to be fetched in the browser behind a `loading` flag, so the server rendered a
 * spinner and none of the body. Reading it here puts the whole page in the HTML.
 */
export const getStaticProps: GetStaticProps<PathDetailProps> = async ({ params }) => {
  const id = String(params?.id);
  const pathData = paths.find((candidate) => candidate.id === id);
  if (!pathData) return { notFound: true };

  const markdownContent = await readPublicFile('build', pathData.markdownPath);
  return { props: { pathData, markdownContent } };
};

const PathDetailPage = ({ pathData, markdownContent }: PathDetailProps) => (
  <PageWrapper>
    <Meta title={pathData.name} description={pathData.description} path={`paths/${pathData.id}`} />
    <Container>
      <Typography.Title className="mt-0 mb-16" level={1}>
        {pathData.name}
      </Typography.Title>
      <Row gutter={[48, 48]}>
        <Col xs={24} lg={12}>
          <Typography.Title className="mt-0 mb-8" level={4}>
            Path
          </Typography.Title>
          <Markdown style={{ lineHeight: '1.4' }} options={markdownOptions}>
            {markdownContent}
          </Markdown>
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
                    src={pathData.images?.service ?? `/images/services/${pathData.service.id}.png`}
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
  </PageWrapper>
);

export default PathDetailPage;
