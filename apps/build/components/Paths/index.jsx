import styled from 'styled-components';
import {
  Row, Card, Col, Button, Typography, Tag,
} from 'antd';
import PropTypes from 'prop-types';
import Image from 'next/image';

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

const StyledImage = styled(Image)`
  border-top-left-radius: 5px;
  display: block;
  height: 100%;
  align-self: center;
  ${({ canImageContain }) => `object-fit: ${canImageContain ? 'contain' : 'cover'};`}
`;

const PathImage = ({ name, id, images }) => (
  <StyledImage
    alt={name}
    src={images?.homepageCard ?? `/images/${id}.png`}
    width={200}
    height={200}
    canImageContain={images.homepageCardImageCanContain}
    className="mx-auto"
  />
);

PathImage.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  images: PropTypes.shape({
    homepageCard: PropTypes.string,
    description: PropTypes.string,
    service: PropTypes.string,
    homepageCardImageCanContain: PropTypes.bool,
  }),
};

PathImage.defaultProps = {
  images: {
    homepageCard: null,
    description: null,
    service: null,
    homepageCardImageCanContain: false,
  },
};

const PathCard = ({ path }) => {
  const {
    id, name, description, service, images,
  } = path;

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
                Contributes to:
                {' '}
                <a href={service.url}>
                  {service.name}
                  {' '}
                  ↗
                </a>
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
          <Button type="primary" href={`/paths/${id}`} className="mb-8">
            View Path
          </Button>
        </Col>
      </Row>
    </StyledCard>
  );
};

PathCard.propTypes = {
  path: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    service: PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string,
    }),
    images: PropTypes.shape({
      homepageCard: PropTypes.string,
      description: PropTypes.string,
      service: PropTypes.string,
    }),
  }).isRequired,
};

export const Paths = () => (
  <>
    <Typography.Title className="mt-0" level={1}>
      Paths
    </Typography.Title>
    <Row gutter={[24, 24]} className="mb-128">
      {paths.map((path) => (
        <Col key={path.id} xs={24} md={12}>
          <PathCard key={path.id} path={path} />
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
                    Submit a PR to the repo to guide developers towards useful
                    code contributions.
                  </Typography.Text>
                </div>
                <Button
                  type="default"
                  href="https://github.com/valory-xyz/autonolas-build-frontend?tab=readme-ov-file#add-your-own-path"
                  target="_blank"
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
