import { Typography } from 'antd';
import { Fragment } from 'react';
import styled from 'styled-components';
import { mainnet } from 'viem/chains';

import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { EXPLORER_URLS, OPERATE_REPO_URL } from 'libs/util-constants/src';
import { STAKING_FACTORY, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

const contracts = [
  {
    name: 'VoteWeighting',
    link: `${EXPLORER_URLS[mainnet.id]}/address/${VOTE_WEIGHTING.addresses[mainnet.id]}`,
  },
  {
    name: 'StakingFactory',
    link: `${EXPLORER_URLS[mainnet.id]}/address/${STAKING_FACTORY.addresses[mainnet.id]}`,
  },
];

const LeftContent = () => (
  <Typography.Text type="secondary">
    {`Contracts: `}
    {contracts.map((item, index) => (
      <Fragment key={index}>
        {index !== 0 && ' • '}
        <a href={item.link} target="_blank" rel="noopener noreferrer">
          {item.name}
        </a>
      </Fragment>
    ))}
  </Typography.Text>
);

const RegulatoryNotice = styled.div`
  max-width: 880px;
  margin: 0 auto;
  padding: 0 24px 24px;
  font-size: 12px;
  color: #949494;
  text-align: center;
`;

export const Footer = () => (
  <>
    <CommonFooter
      leftContent={<LeftContent />}
      centerContent={<FooterCenterContent />}
      githubUrl={OPERATE_REPO_URL}
    />
    <RegulatoryNotice>
      This site has not been reviewed or approved by any competent authority in any Member State
      of the European Union. Site content is set by the Olas DAO and hosted on its behalf by the
      site operator — see the{' '}
      <a href="https://olas.network/disclaimer" target="_blank" rel="noopener noreferrer">
        Disclaimer
      </a>
      . OLAS is a crypto-asset: its value can go down as well as up and you may lose the entire
      amount invested.
    </RegulatoryNotice>
  </>
);
