import { Typography } from 'antd';
import { Fragment } from 'react';
import { mainnet } from 'viem/chains';

import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { EXPLORER_URLS, LAUNCH_REPO_URL } from 'libs/util-constants/src';
import { STAKING_FACTORY, VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { ChainId } from 'common-util/constants/stakingContract';
import { useAppSelector } from 'store/index';

const getContracts = (chainId: ChainId) => [
  {
    name: 'StakingFactory',
    link: `${EXPLORER_URLS[chainId]}/address/${STAKING_FACTORY.addresses[chainId]}`,
  },
  {
    name: 'VoteWeighting',
    link: `${EXPLORER_URLS[mainnet.id]}/address/${VOTE_WEIGHTING.addresses[mainnet.id]}`,
  },
];

const LeftContent = () => {
  const { networkId } = useAppSelector((state) => state.network);

  if (!networkId) return null;

  const contracts = getContracts(networkId as ChainId);

  return (
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
};

export const Footer = () => (
  <CommonFooter
    leftContent={<LeftContent />}
    centerContent={<FooterCenterContent />}
    githubUrl={LAUNCH_REPO_URL}
  />
);
