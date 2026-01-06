import { Typography } from 'antd';
import styled from 'styled-components';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { OPERATOR_NAME } from '../../util/constants';

const FooterContainer = styled.div`
  text-align: center;
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
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
  </FooterContainer>
);

export default Footer;
