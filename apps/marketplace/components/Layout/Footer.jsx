import { useRouter } from 'next/router';
import Link from 'next/link';
import { Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Footer as CommonFooter } from 'libs/ui-components/src';
import { getExplorerURL } from '@autonolas/frontend-library';

import { PAGES_TO_LOAD_WITHOUT_CHAINID } from 'util/constants';
import { ADDRESSES } from 'common-util/Contracts/addresses';
import { getServiceManagerAddress } from 'common-util/Contracts';
import { useHelpers } from 'common-util/hooks';
import Socials from './Socials';
import { ContractsInfoContainer } from './styles';

const { Text } = Typography;

const ContractInfo = () => {
  const { chainId, isL1Network } = useHelpers();
  const router = useRouter();
  const [serviceManagerAddress, setServiceManagerAddress] = useState(null);

  const { pathname } = router;

  useEffect(() => {
    const fetchServiceManagerAddress = async () => {
      try {
        const address = await getServiceManagerAddress();
        setServiceManagerAddress(address);
      } catch (error) {
        console.error('Error fetching service manager address:', error);
      }
    };

    fetchServiceManagerAddress();
  }, []);

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

    if (addresses && (pathname || '').includes('agent-blueprints')) {
      return {
        registryText: 'AgentRegistry',
        managerText: 'RegistriesManager',
        registry: addresses.agentRegistry,
        manager: addresses.registriesManager,
      };
    }

    if (addresses && (pathname || '').includes('ai-agents')) {
      return {
        registryText: 'ServiceRegistry',
        managerText: 'ServiceManager',
        marketplaceText: 'MechMarketplace',
        registry: isL1Network ? addresses.serviceRegistry : addresses.serviceRegistryL2,
        manager: serviceManagerAddress,
        marketplace: addresses.mechMarketplace || null,
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
    <div className="registry-contract">
      &nbsp;•&nbsp;
      <a
        href={`${getExplorerURL(chainId)}/address/${addressToPoint}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    </div>
  );

  const { registry, manager, managerText, registryText, marketplaceText, marketplace } =
    getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      {!PAGES_TO_LOAD_WITHOUT_CHAINID.includes(pathname) && (
        <>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Contracts
          </Text>
          <Text style={{ fontSize: 14 }}>{getContractInfo(registryText, registry)}</Text>
          {manager && <Text style={{ fontSize: 14 }}>{getContractInfo(managerText, manager)}</Text>}
          {marketplace && (
            <Text style={{ fontSize: 14 }}>{getContractInfo(marketplaceText, marketplace)}</Text>
          )}
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
        <Text type="secondary" style={{ fontSize: 14 }}>
          ©&nbsp;Olas DAO&nbsp;
          {new Date().getFullYear()}
          &nbsp;•&nbsp;
        </Text>
        <Link href="/disclaimer" style={{ fontSize: 14 }}>
          Disclaimer
        </Link>
        &nbsp;•&nbsp;
        <a
          style={{ fontSize: 14 }}
          href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
          target="_blank"
          rel="noopener noreferrer"
        >
          DAO Constitution
        </a>
      </>
    }
  />
);

export default Footer;
