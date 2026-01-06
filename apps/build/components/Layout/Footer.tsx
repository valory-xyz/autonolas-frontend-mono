import styled from 'styled-components';
import { Typography } from 'antd';
import { COLOR } from '@autonolas/frontend-library';

import { OPERATOR_NAME } from 'util/constants';
import { PoweredByOlas } from 'components/Branding/PoweredByOlas';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY};
  padding: 48px 0;
`;

const Footer = () => (
  <FooterContainer>
    <Typography.Text type="secondary">
      {`© ${OPERATOR_NAME} ${new Date().getFullYear()} • `}
      <a href="https://olas.network/disclaimer" target="_blank" rel="noopener noreferrer">
        Disclaimer
      </a>
      {' • '}
      <a
        href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
        target="_blank"
        rel="noopener noreferrer"
      >
        DAO Constitution
      </a>
    </Typography.Text>
    <br />
    <br />
    <PoweredByOlas />
  </FooterContainer>
);

export default Footer;
