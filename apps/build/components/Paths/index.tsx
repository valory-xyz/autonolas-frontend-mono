import styled from 'styled-components';
import { Row, Card, Col, Button, Typography, Tag } from 'antd';
import Image from 'next/image';

import { BUILD_REPO_URL } from 'libs/util-constants/src';
import { COLOR } from '@autonolas/frontend-library';
import paths from './data.json';

const StyledCard = styled(Card)`
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  height: 100%;
  align-items: center;
  .ant-card-body {
    padding: 0;
    min-height: 100%;
    display: flex;
  }
`;

const StyledImage = styled(Image)<{ canImageContain: boolean }>`
  border-top-left-radius: 5px;
  display: block;
  height: 100%;
  align-self: center;
  ${({ canImageContain }) => `object-fit: ${canImageContain ? 'contain' : 'cover'};`}
`;

type Path = {
  name: string;
  id: string;
  description: string;
  isMechsToolPath: boolean;
  markdownPath: string;
  service: {
    name: string;
    url: string;
  };
  images: {
    homepageCard: string | null;
    description: string | null;
    service: string | null;
    homepageCardImageCanContain: boolean;
  };
};

type PathImageProps = Pick<Path, 'name' | 'id'> & Partial<Pick<Path, 'images'>>;

const PathImage = ({
  name,
  id,
  images = {
    homepageCard: null,
    description: null,
    service: null,
    homepageCardImageCanContain: false,
  },
}: PathImageProps) => (
  <StyledImage
    alt={name}
    src={images?.homepageCard ?? `/images/${id}.png`}
    width={200}
    height={200}
    canImageContain={images.homepageCardImageCanContain}
    className="mx-auto"
  />
);

const PathCard = ({ path }: { path: Path }) => {
  const { id, name, description, service, images } = path;

  return (
    <StyledCard key={id} style={{ marginBottom: '24px' }}>
      <Row style={{ width: '100%', minHeight: '100%', margin: 'auto 0' }}>
        <Col
          xs={0}
          md={10}
          style={{
            minHeight: '100%',
            alignItems: 'center',
            borderRight: `1px solid ${COLOR.BORDER_GREY}`,
          }}
        >
          <PathImage name={name} id={id} images={images} />
        </Col>
        <Col xs={24} md={14} style={{ padding: '2rem' }}>
          <Col xs={24} md={0}>
            <PathImage name={name} id={id} images={images} />
          </Col>
          <Typography.Title className="mt-0 mb-4" level={4}>
            {name}
          </Typography.Title>
          {service && (
            <div className="mb-4">
              <Typography.Text type="secondary">
                Contributes to: <a href={service.url}>{service.name} ↗</a>
              </Typography.Text>
            </div>
          )}
          <Tag className="mb-4" color="success">
            Rewards available
          </Tag>
          <div className="mb-12" style={{ minHeight: '100px' }}>
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {description}
            </Typography.Paragraph>
          </div>
          <Button type="primary" size="large" href={`/paths/${id}`} className="mb-8">
            View Path
          </Button>
        </Col>
      </Row>
    </StyledCard>
  );
};

export const Paths = () => (
  <>
    <Typography.Title className="mt-0" level={1}>
      Paths
    </Typography.Title>
    <Row gutter={[24, 24]} className="mb-128">
      {paths.map((path) => (
        <Col key={path.id} xs={24} md={12}>
          <PathCard key={path.id} path={path as unknown as Path} />
        </Col>
      ))}
      {/* TODO DRY with PathCard code */}
      <Col xs={24} md={12}>
        <Row style={{ width: '100%', marginBottom: '24px', height: '100%' }}>
          <StyledCard>
            <Row>
              <Col
                xs={0}
                md={10}
                style={{
                  alignItems: 'center',
                  borderRight: `1px solid ${COLOR.BORDER_GREY}`,
                }}
              >
                <PathImage name="Add your own" id="add-your-own" />
              </Col>
              <Col xs={24} md={14} style={{ padding: '2rem' }}>
                <Col xs={24} md={0}>
                  <PathImage name="Add your own" id="add-your-own" />
                </Col>
                <Typography.Title className="mt-0 mb-4" level={4}>
                  Add your own path
                </Typography.Title>
                <div className="mb-16">
                  <Typography.Text type="secondary">
                    Submit a PR to the repo to guide developers towards useful code contributions.
                  </Typography.Text>
                </div>
                <Button
                  type="default"
                  href={BUILD_REPO_URL}
                  target="_blank"
                  size="large"
                  rel="noopener noreferrer"
                >
                  Create PR
                </Button>
              </Col>
            </Row>
          </StyledCard>
        </Row>
      </Col>
    </Row>
  </>
);
