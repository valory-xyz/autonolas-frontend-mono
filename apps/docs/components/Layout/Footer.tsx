import styled from 'styled-components';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';

import { FooterCenterContent } from 'libs/ui-components/src';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
  padding: 48px 0;
`;

const Footer = () => (
  <FooterContainer>
    <FooterCenterContent />
  </FooterContainer>
);

export default Footer;
