import { Typography } from 'antd';
import styled from 'styled-components';

const ContentComingContainer = styled.div`
  width: 100%;
  display: flex;
  height: 500px;
  align-items: center;
  justify-content: center;
`;

const { Text } = Typography;

export const ContentComing = () => (
  <ContentComingContainer>
    <Text type="secondary" style={{ fontSize: 20 }}>
      Content coming soon!
    </Text>
  </ContentComingContainer>
);
