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
      &nbsp;•&nbsp;
    </Typography.Text>
    <a
      href="https://olas.network/disclaimer"
      target="_blank"
      rel="noopener noreferrer"
    >
      Disclaimer
    </a>
    <br />
    <br />
  </FooterContainer>
);

export default Footer;
