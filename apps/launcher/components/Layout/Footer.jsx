import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Footer as CommonFooter } from '@autonolas/frontend-library';

import { useHelpers } from 'common-util/hooks';
import { PAGES_TO_LOAD_WITHOUT_CHAINID } from 'util/constants';

import Socials from './Socials';
import { ContractsInfoContainer } from './styles';

const ContractInfo = () => {
  const { chainId } = useHelpers();
  const router = useRouter();

  const { pathname } = router;

  // if chainId is not set, show empty container
  if (!chainId) return <ContractsInfoContainer />;

  return (
    <ContractsInfoContainer>
      {!PAGES_TO_LOAD_WITHOUT_CHAINID.includes(pathname) && (
        <>
          <div>
            <Image src="/images/etherscan-logo.svg" width={18} height={18} alt="Etherscan link" />
            <span>Contracts</span>
          </div>
        </>
      )}
    </ContractsInfoContainer>
  );
};

const Footer = () => (
  <CommonFooter
    leftContent={<ContractInfo />}
    rightContent={<Socials />}
    centerContent={
      <>
        ©&nbsp;Autonolas DAO&nbsp;
        {new Date().getFullYear()}
        &nbsp;•&nbsp;
        <Link href="/disclaimer">Disclaimer</Link>
      </>
    }
  />
);

export default Footer;
