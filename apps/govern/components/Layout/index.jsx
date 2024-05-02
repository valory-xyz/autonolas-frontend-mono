import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { Layout as AntdLayout, Select } from 'antd';
import { VM_TYPE, useScreen } from '@autonolas/frontend-library';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

import { PAGES_TO_LOAD_WITHOUT_CHAINID } from '../../util/constants';
import { useHelpers } from '../../common-util/hooks';
import {
  ALL_SUPPORTED_CHAINS,
  getSvmEndpoint,
} from '../../common-util/Login/config';
import { useHandleRoute } from '../../common-util/hooks/useHandleRoute';
import { LogoSvg, LogoIconSvg } from '../Logos';
import {
  CustomLayout,
  Logo,
  OlasHeader,
  RightMenu,
  SelectContainer,
} from './styles';

const Login = dynamic(() => import('../Login'), { ssr: false });
const NavigationMenu = dynamic(() => import('./Menu'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });

const { Content } = AntdLayout;

const Layout = ({ children }) => {
  const router = useRouter();
  const { isMobile, isTablet } = useScreen();
  const { vmType, isSvm, chainId, chainName } = useHelpers();
  const path = router?.pathname || '';

  // const { onHomeClick, updateChainId } = useHandleRoute();

  return (
    <CustomLayout>
      <OlasHeader ismobile={`${isMobile}`}>
        <Logo
          // onClick={onHomeClick}
          data-testid="protocol-logo"
          ismobile={`${isMobile}`}
        >
          {<LogoIconSvg />} &nbsp; GOVERN
        </Logo>
        <NavigationMenu />
        <RightMenu>
          <Login />
        </RightMenu>
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">
          {children}
        </div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

Layout.propTypes = { children: PropTypes.element };
Layout.defaultProps = { children: null };

// NOTE: cannot use useHelpers in this component
// because Provider needs to be initialized before.
const LayoutWithWalletProvider = (props) => {
  const chainName = useSelector((state) => state?.setup?.chainName);
  const vmType = useSelector((state) => state?.setup?.vmType);
  const endpoint = getSvmEndpoint(chainName);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={vmType === VM_TYPE.SVM}>
        <Layout {...props}>{props.children}</Layout>
      </WalletProvider>
    </ConnectionProvider>
  );
};

LayoutWithWalletProvider.propTypes = { children: PropTypes.element };
LayoutWithWalletProvider.defaultProps = { children: null };
export default LayoutWithWalletProvider;
