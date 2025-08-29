import styled from 'styled-components';
import { Typography } from 'antd';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { OPERATOR_NAME } from 'apps/docs/util/constants';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY};
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

export default Footer;
