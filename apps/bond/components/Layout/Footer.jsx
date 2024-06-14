import { useRouter } from 'next/router';
import { Grid } from 'antd';
import Image from 'next/image';
import {
  Footer as CommonFooter,
  getExplorerURL,
} from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/constants/addresses';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { ContractsInfoContainer } from './styles';
import { OPERATOR_NAME } from 'util/meta';

const { useBreakpoint } = Grid;

const PATHS_NOT_TO_SHOW = ['/docs', '/disclaimer', '/not-legal'];

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

  const { textOne, addressOne, textTwo, addressTwo } =
    getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      {!PATHS_NOT_TO_SHOW.includes(pathname) && (
        <>
          <Image
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
      centerContent={
        screens.xs ? null : (
          <>
            ©&nbsp;{OPERATOR_NAME}&nbsp;
            {new Date().getFullYear()}
          </>
        )
      }
    />
  );
};

export default Footer;
