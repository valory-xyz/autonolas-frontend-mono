<<<<<<< Updated upstream
import { Typography } from 'antd';

import { Footer as CommonFooter } from '@autonolas/frontend-library';

import Socials from './Socials';
=======
import { Footer as CommonFooter, FooterCenterContent } from "libs/ui-components/src";
import { CONTRIBUTE_REPO_URL } from "libs/util-constants/src";
>>>>>>> Stashed changes

const { Link, Text } = Typography;

const Footer = () => (
  <CommonFooter
    centerContent={
<<<<<<< Updated upstream
      <>
        <div className="mb-12">
          <Text type="secondary">
            ©&nbsp;Autonolas DAO&nbsp;
            {new Date().getFullYear()}
            &nbsp;•&nbsp;
          </Text>
          <Link href="/disclaimer">Disclaimer</Link>
          &nbsp;•&nbsp;
          <Link
            href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
            target="_blank"
            rel="noopener noreferrer"
          >
            DAO Constitution ↗
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Socials />
        </div>
      </>
=======
      <div className="mb-12">
        <FooterCenterContent />
      </div>
>>>>>>> Stashed changes
    }
    githubUrl={CONTRIBUTE_REPO_URL}
  />
);

export default Footer;
