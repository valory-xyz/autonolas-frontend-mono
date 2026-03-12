import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { BUILD_REPO_URL } from 'libs/util-constants/src';

const Footer = () => (
  <CommonFooter centerContent={<FooterCenterContent />} githubUrl={BUILD_REPO_URL} />
);

export default Footer;
