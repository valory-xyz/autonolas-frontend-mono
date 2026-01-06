import { Footer as CommonFooter } from '@autonolas/frontend-library';
import { FooterCenterContent } from 'libs/ui-components/src';

import Socials from './Socials';

const Footer = () => (
  <CommonFooter
    centerContent={
      <>
        <div className="mb-12">
          <FooterCenterContent />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Socials />
        </div>
      </>
    }
  />
);

export default Footer;
