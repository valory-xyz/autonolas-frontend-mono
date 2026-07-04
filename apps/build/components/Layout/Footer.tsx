import styled from "styled-components";

import {
  Footer as CommonFooter,
  FooterCenterContent,
} from "libs/ui-components/src";
import { BUILD_REPO_URL } from "libs/util-constants/src";

const RegulatoryNotice = styled.div`
  max-width: 880px;
  margin: 0 auto;
  padding: 0 24px 24px;
  font-size: 12px;
  color: #949494;
  text-align: center;
`;

const Footer = () => (
  <>
    <CommonFooter
      centerContent={<FooterCenterContent />}
      githubUrl={BUILD_REPO_URL}
    />
    <RegulatoryNotice>
      This site has not been reviewed or approved by any competent authority in
      any Member State of the European Union. Site content is set by the Olas
      DAO and hosted on its behalf by the site operator — see the{" "}
      <a
        href="https://olas.network/disclaimer"
        target="_blank"
        rel="noopener noreferrer"
      >
        Disclaimer
      </a>
      . OLAS is a crypto-asset: its value can go down as well as up and you may
      lose the entire amount invested.
    </RegulatoryNotice>
  </>
);

export default Footer;
