import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { OPERATE_REPO_URL } from 'libs/util-constants/src';

export const Footer = () => (
  <CommonFooter centerContent={<FooterCenterContent />} githubUrl={OPERATE_REPO_URL} />
);
