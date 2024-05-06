import { Layout as AntdLayout } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

import { useScreen } from '@autonolas/frontend-library';

import { useHelpers } from '../../common-util/hooks';
import { PAGES_TO_LOAD_WITHOUT_CHAINID } from '../../util/constants';
import { LogoIconSvg } from '../Logos';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';

const Login = dynamic(() => import('../Login'), { ssr: false });
const NavigationMenu = dynamic(() => import('./Menu'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });

const { Content } = AntdLayout;

const Layout = ({ children }) => {
  const router = useRouter();
  const { isMobile } = useScreen();
  const { isSvm, chainId } = useHelpers();
  const path = router?.pathname || '';

  console.log('Layout: isMobile', chainId);

  return (
    <CustomLayout>
      <OlasHeader ismobile={`${isMobile}`}>
        <Logo data-testid="protocol-logo" ismobile={`${isMobile}`} onClick={() => router.push('/')}>
          {<LogoIconSvg />}
          &nbsp;
          <h1>Launcher</h1>
        </Logo>

        <NavigationMenu />
        <RightMenu>
          <Login />
        </RightMenu>
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">
          {/* chainId has to be set in redux before rendering any components
              OR the page doesn't depends on the chain Id
              OR it is SOLANA */}
          {chainId || isSvm || PAGES_TO_LOAD_WITHOUT_CHAINID.some((e) => e === path)
            ? children
            : null}
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
  return <Layout {...props}>{props.children}</Layout>;
};

LayoutWithWalletProvider.propTypes = { children: PropTypes.element };
LayoutWithWalletProvider.defaultProps = { children: null };
export default LayoutWithWalletProvider;
