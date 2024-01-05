import { useRouter } from 'next/router';
import { Grid } from 'antd';
import Link from 'next/link';
import {
  Footer as CommonFooter,
  getExplorerURL,
} from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/Contracts';
import { useHelpers } from 'common-util/hooks/useHelpers';
import Socials from './Socials';
import { ContractsInfoContainer } from './styles';

const { useBreakpoint } = Grid;

const PATHS_NOT_TO_SHOW = ['/docs', '/disclaimer', '/not-legal'];

const ContractInfo = () => {
  const { chainId } = useHelpers();
  const router = useRouter();
  const { pathname } = router;

  if (!chainId) return <ContractsInfoContainer />;

  const getCurrentPageAddresses = () => {
    if (pathname === '/' || (pathname || '').includes('donate')) {
      return {
        textOne: 'Treasury',
        addressOne: ADDRESSES[chainId].treasury,
      };
    }

    if ((pathname || '').includes('dev-incentives')) {
      return {
        textOne: 'Tokenomics',
        addressOne: ADDRESSES[chainId].tokenomics,
        textTwo: 'Dispenser',
        addressTwo: ADDRESSES[chainId].dispenser,
      };
    }

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

  const {
    textOne, addressOne, textTwo, addressTwo,
  } = getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      {!PATHS_NOT_TO_SHOW.includes(pathname) && (
        <>
          <img
            alt="Etherscan link"
            width={18}
            height={18}
            src="/images/etherscan-logo.svg"
          />
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
  const screens = useBreakpoint();

  return (
    <CommonFooter
      leftContent={<ContractInfo />}
      rightContent={<Socials />}
      centerContent={
        screens.xs ? null : (
          <>
            ©&nbsp;Autonolas DAO&nbsp;
            {new Date().getFullYear()}
            &nbsp;•&nbsp;
            <Link href="/disclaimer">Disclaimer</Link>
            &nbsp;•&nbsp;
            <a
              href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
              target="_blank"
              rel="noopener noreferrer"
            >
              DAO Constitution
            </a>
          </>
        )
      }
    />
  );
};

export default Footer;
