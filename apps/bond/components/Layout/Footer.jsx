import styled from 'styled-components';
import { Typography } from 'antd';
import { COLOR } from '@autonolas/frontend-library';
// import Link from 'next/link';

import { OPERATOR_NAME } from 'util/meta';
import { PoweredByOlas } from 'components/Branding/PoweredByOlas';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY};
  padding: 48px 0;
`;

const Footer = () => (
  <FooterContainer>
    <Typography.Text>
      ©
      {' '}
      {OPERATOR_NAME}
      {' '}
      {new Date().getFullYear()}
      {' '}
      {/* •
      {' '}
      <Link href="/disclaimer">Disclaimer</Link>
      {' '}
      •
      {' '}
      <Link href="/privacy-policy">DAO Constitution</Link> */}

      {/* {' '}
      ·
      {' '}
       */}
    </Typography.Text>
    <br />
    <br />
    <PoweredByOlas />
  </FooterContainer>
);

export default Footer;
