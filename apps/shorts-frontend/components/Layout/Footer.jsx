import {
  Footer as CommonFooter,
  ServiceStatusInfo,
} from '@autonolas-frontend-mono/feature-service-status-info';

import { FooterContainer } from './styles';

const Footer = () => (
  <FooterContainer>
    <CommonFooter className="custom-footer" />
    <ServiceStatusInfo appType="mechkit" />
  </FooterContainer>
);

export default Footer;
