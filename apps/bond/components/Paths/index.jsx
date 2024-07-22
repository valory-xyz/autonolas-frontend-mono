import { Button, Card, Col, Row, Typography } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import pathData from './data.json';

const StyledCard = styled(Card)`
  width: 100%;
  .ant-card-body {
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const ImageWrapper = styled.div`
  margin-bottom: 8px;
`;

const TitleWrapper = styled.div`
  margin-bottom: 16px;
`;

const PathButton = styled(Button)`
  margin-top: 16px;
`;

const PathCard = ({ path: { id, name } }) => {
  const router = useRouter();
  return (
    <StyledCard>
      <ImageWrapper>
        <Image src={`/images/paths/${id}.svg`} alt={name} width={200} height={100} />
      </ImageWrapper>
      <TitleWrapper>
        <Typography.Title className="text-center mt-0" level={5}>
          {name}
        </Typography.Title>
      </TitleWrapper>
      <PathButton type="primary" size="large" block onClick={() => router.push(`/paths/${id}`)}>
        View Path
      </PathButton>
    </StyledCard>
  );
};

PathCard.propTypes = {
  path: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

export const Paths = () => (
  <>
    <Typography.Title style={{ marginTop: 16 }} level={2}>
      Paths
    </Typography.Title>
    <Row gutter={[24, 24]} className="mb-128">
      {pathData.map((path) => (
        <Col key={path.id} xs={24} sm={24} md={12} lg={6}>
          <PathCard key={path.id} path={path} />
        </Col>
      ))}
    </Row>
  </>
);
