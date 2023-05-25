import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import get from 'lodash/get';
import { GNOSIS_SCAN_URL } from 'util/constants';
import { Footer as CommonFooter } from '@autonolas/frontend-library';
import { ADDRESSES, getWeb3Details } from 'common-util/Contracts';
import { FooterContainer, ContractsInfoContainer } from './styles';

const ContractInfo = () => {
  const chainId = useSelector((state) => get(state, 'setup.chainId'));
  const router = useRouter();

  const [addressChainId, setAddressChainId] = useState(chainId);
  const { pathname, query } = router;

  // if chainId changes, update the chainId required for address
  useEffect(() => {
    setAddressChainId(chainId);
  }, [chainId]);

  // if there are no chainId, try to fetch from web3Details (ie. WEB3_PROVIDER)
  // else fallback to 100 (gnosisscan address)
  useEffect(() => {
    if (!addressChainId) {
      setAddressChainId(getWeb3Details().chainId || 1);
    }
  }, []);

  if (!addressChainId) return <ContractsInfoContainer />;

  const addresses = ADDRESSES[addressChainId];
  const getCurrentPageAddresses = () => {
    if (addresses) {
      const path = pathname || '';

      if (path === '/' || path.includes('registry')) {
        return {
          registryText: 'AgentRegistry',
          managerText: 'RegistriesManager',
          registry: addresses.agentRegistry,
          manager: addresses.agentFactory,
        };
      }

      if (path === '/mech') {
        return {
          registryText: 'MechRegistry',
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

  const {
    registry, manager, managerText, registryText,
  } = getCurrentPageAddresses();

  if (!registry && !manager) return null;

  return (
    <ContractsInfoContainer>
      <>
        <img
          alt="Etherscan link"
          width={18}
          height={18}
          src="/images/gnosisscan-logo.svg"
        />
        <span>Contracts</span>
        &nbsp;•&nbsp;
        {getContractInfo(registryText, registry)}
        {manager && (
          <>
            &nbsp;•&nbsp;
            {getContractInfo(managerText, manager)}
          </>
        )}
      </>
    </ContractsInfoContainer>
  );
};

const Footer = () => (
  <FooterContainer>
    <CommonFooter leftContent={<ContractInfo />} className="custom-footer" />
  </FooterContainer>
);

export default Footer;
