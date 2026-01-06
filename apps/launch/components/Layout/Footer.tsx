import { Typography } from 'antd';
import { Fragment } from 'react';
import { mainnet } from 'viem/chains';

import { Footer as CommonFooter } from 'libs/ui-components/src';
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
  <CommonFooter
    leftContent={<LeftContent />}
    centerContent={<CenterContent />}
    githubUrl={LAUNCH_REPO_URL}
  />
);
