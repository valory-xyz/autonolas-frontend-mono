import { Typography } from 'antd';
import { Fragment } from 'react';
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

export const Footer = () => (
  <CommonFooter
    leftContent={<LeftContent />}
    centerContent={<FooterCenterContent />}
    githubUrl={OPERATE_REPO_URL}
  />
);
