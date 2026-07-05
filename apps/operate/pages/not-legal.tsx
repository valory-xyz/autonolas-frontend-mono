import { Result } from 'antd';
import styled from 'styled-components';

const NotLegalContainer = styled.div`
  position: relative;
  top: 100px;
`;

const NotLegal = () => (
  <NotLegalContainer>
    <Result
      status="warning"
      title="Access restricted"
      subTitle="Due to applicable legal and regulatory requirements, access to this site is not available from your current region."
    />
  </NotLegalContainer>
);

export default NotLegal;
