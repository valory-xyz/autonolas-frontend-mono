import Link from 'next/link';

import { Footer as CommonFooter } from '@autonolas/frontend-library';

import Socials from './Socials';

const Footer = () => (
  <CommonFooter
    rightContent={<Socials />}
    centerContent={
      <>
        ©&nbsp;Autonolas DAO&nbsp;
        {new Date().getFullYear()}
        &nbsp;•&nbsp;
        <Link href="/disclaimer">Disclaimer</Link>
        &nbsp;•&nbsp;
        <a
          href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
          target="_blank"
          rel="noopener noreferrer"
        >
          DAO Constitution
        </a>
      </>
    }
  />
);

export default Footer;
