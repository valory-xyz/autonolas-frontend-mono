import styled from 'styled-components';
import {
  Row, Card, Col, Button, Typography, Tag, Grid,
} from 'antd';
import PropTypes from 'prop-types';
import Image from 'next/image';

import { COLOR } from '@autonolas/frontend-library';
import paths from './data.json';

const { useBreakpoint } = Grid;

const StyledCard = styled(Card)`
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  display: flex;
  align-items: center;
  .ant-card-body {
    padding: 0;
    display: flex;
    flex-direction: row;
  }
`;

const StyledImage = styled(Image)`
  border-top-left-radius: 5px;
  display: block;
  object-fit: cover;
  height: 100%;
  align-self: center;
`;

const PathImage = ({ name, id }) => (
  <StyledImage
    alt={name}
    src={`/images/${id}.png`}
    width={200}
    height={200}
    layout="intrinsic"
    className="mx-auto"
  />
);

PathImage.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

const PathCard = ({ path }) => {
  const {
    id, name, description, service,
  } = path;

  const { md } = useBreakpoint();

  return (
    <Row key={id} style={{ width: '100%', marginBottom: '24px' }}>
      <StyledCard>
        <Col
          xs={0}
          md={10}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderRight: md && `1px solid ${COLOR.BORDER_GREY}`,
          }}
        >
          <PathImage name={name} id={id} />
        </Col>
        <Col xs={24} md={14} style={{ padding: '2rem' }}>
          {!md && <PathImage name={name} id={id} />}
          <Typography.Title className="mt-0 mb-4" level={4}>
            {name}
          </Typography.Title>
          {
            service && (
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

            )
          }
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
      </StyledCard>
    </Row>
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
    }).isRequired,
  }).isRequired,
};

export const Paths = () => {
  const { md } = useBreakpoint();
  return (
    <>
      <Typography.Title className="mt-0" level={2}>Paths</Typography.Title>
      <Row gutter={[24, 24]} className="mb-128">
        {paths.map((path) => (
          <Col key={path.id} xs={24} md={12}>
            <PathCard key={path.id} path={path} />
          </Col>
        ))}
        {/* TODO DRY with PathCard code */}
        <Col xs={24} md={12}>
          <Row style={{ width: '100%', marginBottom: '24px' }}>
            <StyledCard>
              <Col
                xs={0}
                md={10}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRight: md && `1px solid ${COLOR.BORDER_GREY}`,
                }}
              >
                <PathImage name="Add your own" id="add-your-own" />
              </Col>
              <Col xs={24} md={14} style={{ padding: '2rem' }}>
                {!md && <PathImage name="Add your own" id="add-your-own" />}
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
            </StyledCard>
          </Row>
        </Col>
      </Row>
    </>
  );
};
