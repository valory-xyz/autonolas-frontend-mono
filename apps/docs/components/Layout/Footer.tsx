import { DOCS_REPO_URL } from '@autonolas-frontend-mono/util-constants';
import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';

const Footer = () => <CommonFooter centerContent={<FooterCenterContent />} githubUrl={DOCS_REPO_URL} />;

export default Footer;
