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
      subTitle={
        <>
          Due to applicable legal and regulatory requirements, access to this site is not available
          from your current region. We use your approximate location data (region-level IP
          information) solely for the purpose of enforcing this restriction and do not store this
          information. For more details, please refer to our{' '}
          <a href="https://olas.network/disclaimer" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </>
      }
    />
  </NotLegalContainer>
);

export default NotLegal;
