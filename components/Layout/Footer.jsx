import { Flex } from 'antd';
import { useRouter } from 'next/router';

import { Footer as CommonFooter, ServiceStatusInfo } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/Contracts';
import { useHelpers } from 'common-util/hooks';
import { GNOSIS_SCAN_URL, URL } from 'util/constants';

import { ContractsInfoContainer, FooterContainer } from './styles';

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

      if (path === '/factory') {
        return {
          registryText: 'AgentFactory',
          registry: addresses.agentFactory,
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

  const getContractInfo = (text, addressToPoint) => (
    <div className="registry-contract">
      <a
        href={`${GNOSIS_SCAN_URL}address/${addressToPoint}`}
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
      <Flex gap={4} wrap="wrap">
        <img alt="Etherscan link" width={18} height={18} src="/images/gnosisscan-logo.svg" />
        <span>Contracts</span>
        &nbsp;•&nbsp;
        {getContractInfo(registryText, registry)}
        {manager && (
          <>
            &nbsp;•&nbsp;
            {getContractInfo(managerText, manager)}
          </>
        )}
      </Flex>
    </ContractsInfoContainer>
  );
};

const Footer = () => (
  <FooterContainer>
    <CommonFooter leftContent={<ContractInfo />} className="custom-footer" />
    <ServiceStatusInfo appType="mechkit" />
  </FooterContainer>
);

export default Footer;
