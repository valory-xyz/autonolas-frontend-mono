import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Footer as CommonFooter, getExplorerURL } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/Contracts/addresses';
import { useHelpers } from 'common-util/hooks';
import { PAGES_TO_LOAD_WITHOUT_CHAINID } from 'util/constants';

import Socials from './Socials';
import { ContractsInfoContainer } from './styles';

const ContractInfo = () => {
  const { chainId, isL1Network, doesNetworkHaveValidServiceManagerToken } = useHelpers();
  const router = useRouter();

  const { pathname } = router;

  // if chainId is not set, show empty container
  if (!chainId) return <ContractsInfoContainer />;

  const addresses = ADDRESSES[chainId];
  const getCurrentPageAddresses = () => {
    if (addresses && (pathname || '').includes('components')) {
      return {
        registryText: 'ComponentRegistry',
        managerText: 'RegistriesManager',
        registry: addresses.componentRegistry,
        manager: addresses.registriesManager,
      };
    }

    if (addresses && (pathname || '').includes('agents')) {
      return {
        registryText: 'AgentRegistry',
        managerText: 'RegistriesManager',
        registry: addresses.agentRegistry,
        manager: addresses.registriesManager,
      };
    }

    if (addresses && (pathname || '').includes('services')) {
      return {
        registryText: 'ServiceRegistry',
        managerText: 'ServiceManager',
        registry: isL1Network ? addresses.serviceRegistry : addresses.serviceRegistryL2,
        manager: doesNetworkHaveValidServiceManagerToken
          ? addresses.serviceManagerToken
          : addresses.serviceManager,
      };
    }

    return {
      registry: null,
      manager: null,
      registryText: null,
      managerText: null,
    };
  };

  const getContractInfo = (text, addressToPoint) => (
    <div className="registry-contract">&nbsp;•&nbsp; Contract Info</div>
  );

  const { registry, manager, managerText, registryText } = getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      {!PAGES_TO_LOAD_WITHOUT_CHAINID.includes(pathname) && (
        <>
          <div>
            <Image src="/images/etherscan-logo.svg" width={18} height={18} alt="Etherscan link" />
            <span>Contracts</span>
          </div>
          {getContractInfo(registryText, registry)}
          {getContractInfo(managerText, manager)}
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
