import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { CONTRIBUTE_REPO_URL } from 'libs/util-constants/src';

const Footer = () => (
  <CommonFooter
    centerContent={
      <div className="mb-12">
        <FooterCenterContent />
      </div>
    }
    githubUrl={CONTRIBUTE_REPO_URL}
  />
);

export default Footer;
