import {
  Footer as CommonFooter,
  ServiceStatusInfo,
} from '@autonolas/frontend-library';

import { FooterContainer } from './styles';

const Footer = () => (
  <FooterContainer>
    <CommonFooter className="custom-footer" />
    <ServiceStatusInfo appType="mechkit" />
  </FooterContainer>
);

export default Footer;
