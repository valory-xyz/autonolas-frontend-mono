import { Col, Row, Typography } from 'antd';
import Markdown from 'markdown-to-jsx';
import Image from 'next/image';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import { Path } from 'common-util/constants/paths';

const Upcase = styled(Typography.Text)`
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.07em;
`;

type PathDetailPageProps = {
  path: Path;
  markdown: string;
};

/**
 * The path and its guide arrive from `getStaticProps`, so both are in the served HTML.
 *
 * They used to be resolved in the browser — the guide via `fetch('/paths-markdown/<id>.md')` and
 * the path from `router.query`, which is empty during a pre-render. That left one 105-character
 * shell standing in for every path. Taking them as props also removes the loading and
 * not-found states: an unknown id never reaches this component now, it 404s in `getStaticPaths`.
 */
export const PathDetailPage = ({ path, markdown }: PathDetailPageProps) => (
  <>
    <Typography.Title className="mt-0 mb-16" level={3}>
      {path.name}
    </Typography.Title>
    <Row gutter={[48, 48]}>
      <Col xs={24} lg={12}>
        <Typography.Title className="mt-0 mb-8" level={4}>
          Path
        </Typography.Title>
        <Markdown style={{ lineHeight: '1.4' }}>{markdown}</Markdown>
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
                src={`/images/paths/${path.id}.png`}
                alt={path.name}
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
              <Typography.Paragraph>{path.description}</Typography.Paragraph>
            </Col>
          </Row>
        </section>
      </Col>
    </Row>
  </>
);
