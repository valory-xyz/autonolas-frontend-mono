import styled from 'styled-components';
import { COLOR } from '@autonolas/frontend-library';

import { FooterCenterContent } from 'libs/ui-components/src';
import { PoweredByOlas } from 'components/Branding/PoweredByOlas';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY};
  padding: 48px 0;
`;

const Footer = () => (
  <FooterContainer>
    <FooterCenterContent />
    <br />
    <br />
    <PoweredByOlas />
  </FooterContainer>
);

export default Footer;
