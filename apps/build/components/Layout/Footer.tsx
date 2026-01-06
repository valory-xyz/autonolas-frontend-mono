<<<<<<< Updated upstream
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
=======
import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { BUILD_REPO_URL } from 'libs/util-constants/src';

const Footer = () => <CommonFooter centerContent={<FooterCenterContent />} githubUrl={BUILD_REPO_URL} />;
>>>>>>> Stashed changes

export default Footer;
