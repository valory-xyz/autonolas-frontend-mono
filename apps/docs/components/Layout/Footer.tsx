<<<<<<< Updated upstream
import styled from 'styled-components';
import { Typography } from 'antd';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { OPERATOR_NAME } from '../../util/constants';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
  padding: 48px 0;
`;

const Footer = () => (
  <FooterContainer>
    <Typography.Text>
      © {OPERATOR_NAME} {new Date().getFullYear()}
    </Typography.Text>
    <br />
    <br />
  </FooterContainer>
);
=======
import { DOCS_REPO_URL } from '@autonolas-frontend-mono/util-constants';
import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';

const Footer = () => <CommonFooter centerContent={<FooterCenterContent />} githubUrl={DOCS_REPO_URL} />;
>>>>>>> Stashed changes

export default Footer;
