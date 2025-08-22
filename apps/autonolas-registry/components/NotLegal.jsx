import { Result } from 'antd';
import styled from 'styled-components';

const NotLegalContainer = styled.div`
  position: relative;
  top: 100px;
`;

export const NotLegal = () => (
  <NotLegalContainer>
    <Result status="warning" title="Access is blocked for countries on the OFAC-sanctioned list" />
  </NotLegalContainer>
);
