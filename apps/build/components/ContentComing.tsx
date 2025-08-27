import { Typography } from 'antd';
import styled from 'styled-components';

const ContentComingContainer = styled.div`
  width: 100%;
  height: 100%;
  margin-top: 50px;
  text-align: center;
`;

const { Text } = Typography;

export const ContentComing = () => (
  <ContentComingContainer>
    <Text type="secondary">Content coming soon!</Text>
  </ContentComingContainer>
);
