import { Typography } from 'antd';
import styled from 'styled-components';

const { Paragraph } = Typography;
export const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
`;

export const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 24px;
`;

export const Hint = styled(Paragraph)`
  margin-top: 4px;
  font-size: 14px;
`;
