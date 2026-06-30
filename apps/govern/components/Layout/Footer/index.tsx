import { Typography } from 'antd';
import { Fragment } from 'react';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useRouter } from 'next/router';

import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { EXPLORER_URLS, GOVERN_REPO_URL } from 'libs/util-constants/src';
import {
  GOVERNOR_OLAS,
  VE_OLAS,
  VOTE_WEIGHTING,
} from 'libs/util-contracts/src/lib/abiAndAddresses';

import { Onboarding } from './Onboarding';

const veOlasContract = {
  name: 'veOLAS',
  link: `${EXPLORER_URLS[mainnet.id]}/address/${VE_OLAS.addresses[mainnet.id]}`,
};

const voteWeightingContract = {
  name: 'VoteWeighting',
  link: `${EXPLORER_URLS[mainnet.id]}/address/${VOTE_WEIGHTING.addresses[mainnet.id]}`,
};

const governorContract = {
  name: 'GovernorOLAS',
  link: `${EXPLORER_URLS[mainnet.id]}/address/${
    (GOVERNOR_OLAS.addresses as Record<number, Address>)[mainnet.id]
  }`,
};

// On the proposals page the governor contract is the relevant one;
// VoteWeighting is relevant for the other (voting) tabs.
const getContracts = (pathname: string) =>
  pathname === '/proposals'
    ? [governorContract, veOlasContract]
    : [voteWeightingContract, veOlasContract];

const LeftContent = () => {
  const { pathname } = useRouter();
  const contracts = getContracts(pathname);

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
  <>
    <CommonFooter
      leftContent={<LeftContent />}
      centerContent={<FooterCenterContent />}
      githubUrl={GOVERN_REPO_URL}
    />
    <Onboarding />
  </>
);
