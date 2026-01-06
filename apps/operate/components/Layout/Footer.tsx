import { Typography } from 'antd';

import { Footer as CommonFooter } from 'libs/ui-components/src';
import { OPERATE_REPO_URL } from 'libs/util-constants/src';

const CenterContent = () => (
  <Typography.Text type="secondary">
    {`© Olas DAO ${new Date().getFullYear()} • `}
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
);

export const Footer = () => (
  <CommonFooter centerContent={<CenterContent />} githubUrl={OPERATE_REPO_URL}/>
);
