<<<<<<< Updated upstream
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
=======
import { DOCS_REPO_URL } from '@autonolas-frontend-mono/util-constants';
import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';

const Footer = () => <CommonFooter centerContent={<FooterCenterContent />} githubUrl={DOCS_REPO_URL} />;
>>>>>>> Stashed changes

export default Footer;
