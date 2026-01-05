import { Card, Col, Row, Typography } from 'antd';
import styled from 'styled-components';

import { COLOR } from '@autonolas/frontend-library';

const { Text } = Typography;

const CONTENT_MAX_WIDTH = 720;

const BuildContainer = styled.div`
  max-width: ${CONTENT_MAX_WIDTH}px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const DocsCard = styled(Card)`
  height: auto;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
  border: 1px solid #fff;
  background: linear-gradient(
    180deg,
    var(--Colors-Neutral-colorWhite, rgba(255, 255, 255, 0.5)) 0%,
    var(--Colors-Base-Neutral-1, rgba(242, 244, 249, 0.5)) 100%
  );
  box-shadow: 8px 8px 24px 0 rgba(24, 39, 75, 0.12);

  &:hover {
    background: ${COLOR.WHITE};
  }

  .ant-card-body {
    padding: 24px 16px;
  }
`;

const resources = [
  {
    label: "Build with Olas' own agent framework",
    linkText: 'Open Autonomy',
    link: 'https://stack.olas.network/open-autonomy',
  },
  {
    label: 'Build with other agent frameworks',
    linkText: 'Olas SDK',
    link: 'https://stack.olas.network/olas-sdk',
  },
];

export const BuildAnAgent = () => (
  <BuildContainer>
    <Row gutter={[16, 16]}>
      {resources.map((item, index) => (
        <Col key={index} span={12} xs={24} sm={24} md={12}>
          <DocsCard>
            <Text className="mb-4" style={{ fontWeight: 500 }}>
              {item.label}
            </Text>
            <br />
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.linkText}
            </a>
          </DocsCard>
        </Col>
      ))}
    </Row>
  </BuildContainer>
);
