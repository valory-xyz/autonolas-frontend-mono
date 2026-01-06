import { Typography } from 'antd';

import { Footer as CommonFooter } from '@autonolas/frontend-library';

import Socials from './Socials';

const { Link, Text } = Typography;

const Footer = () => (
  <CommonFooter
    centerContent={
      <>
        <div className="mb-12">
          <Text type="secondary">
            ©&nbsp;Olas DAO&nbsp;
            {new Date().getFullYear()}
            &nbsp;•&nbsp;
          </Text>
          <a href="https://olas.network/disclaimer" target="_blank" rel="noopener noreferrer">
            Disclaimer
          </a>
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
    }
  />
);

export default Footer;
