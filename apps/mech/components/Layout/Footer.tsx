import Image from 'next/image';
import { useRouter } from 'next/router';
import { Grid } from 'antd';

import { Footer as CommonFooter, ServiceStatusInfo } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/Contracts';
import { useHelpers } from 'common-util/hooks';
import { SCAN_IMAGES, SCAN_URLS, URL } from 'util/constants';

import { ContractsInfoContainer } from './styles';

const { useBreakpoint } = Grid;

const OPERATOR_NAME = 'Olas (aka Autonolas) DAO';

const ContractInfo = () => {
  const { chainId } = useHelpers();
  const router = useRouter();
  const { pathname, query } = router;

  // if chainId is not set, show empty container
  if (!chainId) return <ContractsInfoContainer />;

  const addresses = ADDRESSES[chainId];

  const getCurrentPageAddresses = () => {
    if (addresses) {
      const path = pathname || '';

      if (path === '/' || path.includes(URL.MECHS)) {
        return {
          registryText: 'MechMarketplace',
          registry: addresses.mechMarketplace,
          managerText: 'AgentRegistry',
          manager: addresses.agentRegistry,
        };
      }

      if (path === '/mech') {
        return {
          registryText: 'Mech',
          registry: query?.id,
        };
      }
    }

    return {
      registry: null,
      manager: null,
      registryText: null,
      managerText: null,
    };
  };

  const getContractInfo = (text: string, addressToPoint: string) => (
    <div className="registry-contract">
      <a
        href={`${SCAN_URLS[chainId]}/address/${addressToPoint}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    </div>
  );

  const { registry, manager, managerText, registryText } = getCurrentPageAddresses();

  if (!registry && !manager) return null;

  return (
    <ContractsInfoContainer>
      <Image alt="Etherscan link" width={18} height={18} src={SCAN_IMAGES[chainId]}/>
      <span>Contracts</span>
      &nbsp;•&nbsp;
      {registry && typeof registry === "string" && getContractInfo(registryText, registry)}
      {manager && (
        <>
          &nbsp;•&nbsp;
          {getContractInfo(managerText, manager)}
        </>
      )}
    </ContractsInfoContainer>
  );
};

const Footer = () => {
  const screens = useBreakpoint();

  return (
    <>
      <CommonFooter
        leftContent={<ContractInfo />}
        centerContent={
          screens.xs ? undefined : (
            <>
              ©&nbsp;{OPERATOR_NAME}&nbsp;
              {new Date().getFullYear()}
            </>
          )
        }
        rightContent={
          <a href="https://olas.network/disclaimer" target="_blank" rel="noopener noreferrer">
            Disclaimer
          </a>
        }
      />
      <ServiceStatusInfo appType="mechkit" />
    </>
  );
};

export default Footer;
