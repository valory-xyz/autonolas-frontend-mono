import { Grid, Typography } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { Footer as CommonFooter, getExplorerURL } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/constants/addresses';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { OPERATOR_NAME } from 'util/meta';

import { ContractsInfoContainer } from './styles';

const { useBreakpoint } = Grid;

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

const CenterContent = () => (
  <Typography.Text type="secondary">
    {`© ${OPERATOR_NAME} ${new Date().getFullYear()} • `}
    <a href="https://olas.network/disclaimer" target="_blank" rel="noopener noreferrer">
      Disclaimer
    </a>
    {' • '}
    <a
      href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
      target="_blank"
      rel="noopener noreferrer"
    >
      DAO Constitution
    </a>
  </Typography.Text>
);

const Footer = () => {
  const screens = useBreakpoint();

  return (
    <CommonFooter
      leftContent={<ContractInfo />}
      centerContent={screens.xs ? null : <CenterContent />}
    />
  );
};

export default Footer;
