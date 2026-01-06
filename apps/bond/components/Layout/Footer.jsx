import Image from 'next/image';
import { useRouter } from 'next/router';

import { Footer as CommonFooter, FooterCenterContent } from 'libs/ui-components/src';
import { BOND_REPO_URL } from 'libs/util-constants/src';

import { ADDRESSES } from 'common-util/constants/addresses';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { ContractsInfoContainer } from './styles';
import { getExplorerURL } from '@autonolas/frontend-library';

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
        href={`${getExplorerURL(chainId)}/address/${addressToPoint}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    </div>
  );

  const { textOne, addressOne, textTwo, addressTwo } = getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      {!PATHS_NOT_TO_SHOW.includes(pathname) && (
        <>
          <Image alt="Etherscan link" width={18} height={18} src="/images/etherscan-logo.svg" />
          <span>Contracts</span>
          &nbsp;•&nbsp;
          {getContractInfo(textOne, addressOne)}
          {textTwo && addressTwo && (
            <>
              &nbsp;•&nbsp;
              {getContractInfo(textTwo, addressTwo)}
            </>
          )}
        </>
      )}
    </ContractsInfoContainer>
  );
};

const Footer = () => {
  return (
    <CommonFooter
      leftContent={<ContractInfo />}
      centerContent={<FooterCenterContent />}
      githubUrl={BOND_REPO_URL}
    />
  );
};

export default Footer;
