import { Button, Card, Col, Grid, Row, Typography } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import { PATHS, Path, YOUR_OWN_PATH } from 'common-util/constants/paths';

const StyledMain = styled.main`
  max-width: 1400px;
  margin: auto;
`;

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

const PathImage = ({ name, id }: { name: string; id: string }) => (
  <StyledImage
    alt={name}
    src={`/images/paths/${id}.png`}
    width={200}
    height={200}
    layout="intrinsic"
    className="mx-auto"
  />
);

const PathCard = ({ path }: { path: Path }) => {
  const { id, name, description } = path;

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
            justifyContent: 'center',
            borderRight: md ? `1px solid ${COLOR.BORDER_GREY}` : undefined,
          }}
        >
          <PathImage name={name} id={id} />
        </Col>
        <Col xs={24} md={14} style={{ padding: '2rem' }}>
          {!md && <PathImage name={name} id={id} />}
          <Typography.Title className="mt-0 mb-4" level={4}>
            {name}
          </Typography.Title>
          <div className="mb-12" style={{ minHeight: '100px' }}>
            <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {description}
            </Typography.Paragraph>
          </div>
          <Link href={`/paths/${id}`} passHref>
            <Button size="large" type="primary" className="mb-8">
              View Path
            </Button>
          </Link>
        </Col>
      </StyledCard>
    </Row>
  );
};

export const PathsPage = () => {
  const { md } = useBreakpoint();
  return (
    <StyledMain>
      <Typography.Title className="mt-0" level={2}>
        Paths
      </Typography.Title>
      <Row gutter={[24, 24]} className="mb-128">
        {PATHS.map((path) => (
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
                  borderRight: md ? `1px solid ${COLOR.BORDER_GREY}` : undefined,
                }}
              >
                <PathImage name="Add your own" id="add-your-own" />
              </Col>
              <Col xs={24} md={14} style={{ padding: '2rem' }}>
                {!md && <PathImage name="Add your own" id="add-your-own" />}
                <Typography.Title className="mt-0 mb-4" level={4}>
                  {YOUR_OWN_PATH.name}
                </Typography.Title>
                <div className="mb-16">
                  <Typography.Text type="secondary">{YOUR_OWN_PATH.description}</Typography.Text>
                </div>
                <Button
                  size="large"
                  type="default"
                  href={YOUR_OWN_PATH.link}
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
    </StyledMain>
  );
};
