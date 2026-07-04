import Image from 'next/image';
import { useRouter } from 'next/router';
import styled from 'styled-components';

import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { BOND_REPO_URL, EXPLORER_URLS } from 'libs/util-constants/src';

import { ADDRESSES } from 'common-util/constants/addresses';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { ContractsInfoContainer } from './styles';

const PATHS_NOT_TO_SHOW = ['/', '/paths', '/manage-solana-liquidity', '/docs', '/not-legal'];

const ContractInfo = () => {
  const { chainId } = useHelpers();
  const { pathname } = useRouter();

  if (!chainId) return <ContractsInfoContainer />;

  const getCurrentPageAddresses = () => {
    if ((pathname || '').includes('bonding-products')) {
      return {
        textOne: 'Depository',
        addressOne: ADDRESSES[chainId].depository,
      };
    }

    if ((pathname || '').includes('my-bonds')) {
      return {
        textOne: 'Depository',
        addressOne: ADDRESSES[chainId].depository,
      };
    }

    return { textOne: null, addressOne: null };
  };

  const getContractInfo = (text, addressToPoint) => (
    <div className="registry-contract">
      <a
        href={`${EXPLORER_URLS[chainId]}/address/${addressToPoint}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    </div>
  );

  const { textOne, addressOne } = getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      {!PATHS_NOT_TO_SHOW.includes(pathname) && textOne && addressOne && (
        <>
          <Image alt="Etherscan link" width={18} height={18} src="/images/etherscan-logo.svg" />
          <span>Contracts</span>
          &nbsp;•&nbsp;
          {getContractInfo(textOne, addressOne)}
        </>
      )}
    </ContractsInfoContainer>
  );
};

const RegulatoryNotice = styled.div`
  max-width: 880px;
  margin: 0 auto;
  padding: 0 24px 24px;
  font-size: 12px;
  color: #949494;
  text-align: center;
`;

const Footer = () => {
  return (
    <>
      <CommonFooter
        leftContent={<ContractInfo />}
        centerContent={<FooterCenterContent />}
        githubUrl={BOND_REPO_URL}
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
};

export default Footer;
