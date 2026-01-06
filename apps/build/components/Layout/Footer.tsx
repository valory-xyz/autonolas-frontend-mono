<<<<<<< Updated upstream
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
    <Typography.Text>
      © {OPERATOR_NAME} {new Date().getFullYear()}
      {/* {' '}
      ·
      {' '}
      <Link href="/disclaimer">Disclaimer</Link> */}
    </Typography.Text>
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
