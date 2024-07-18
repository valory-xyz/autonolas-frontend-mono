import { ExportOutlined } from '@ant-design/icons';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Layout as AntdLayout, Menu } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

import { useHelpers } from 'common-util/hooks/useHelpers';
import { Logo as LogoSvg } from 'components/Branding/Logo';

import Login from '../Login';
import Footer from './Footer';
import { CustomLayout, DocsLink, Logo } from './styles';

const wallets = [new PhantomWalletAdapter()];

const { Header, Content } = AntdLayout;

const endpoint = process.env.NEXT_PUBLIC_SOLANA_MAINNET_BETA_URL;

const StyledHeader = styled(Header)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
`;

const Layout = ({ children }) => {
  const router = useRouter();
  const { chainId } = useHelpers();

  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (router.pathname) {
      const name = router.pathname.split('/')[1];
      setSelectedMenu(name || 'paths');
    }
  }, [router.pathname]);

  const handleMenuItemClick = ({ key }) => {
    if (key === 'docs') {
      window.open('https://docs.autonolas.network/protocol/tokenomics/', '_blank');
    } else {
      router.push(`/${key}`);
      setSelectedMenu(key);
    }
  };

  return (
    <CustomLayout pathname={router.pathname}>
      <StyledHeader>
        <div className="column-1">
          <Link href="/">
            <Logo data-testid="tokenomics-logo">
              <LogoSvg />
            </Logo>
          </Link>
        </div>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
          onClick={handleMenuItemClick}
          items={[
            { key: 'paths', label: 'Paths' },
            { key: 'bonding-products', label: 'Bonding Products' },
            { key: 'my-bonds', label: 'My Bonds' },
            {
              key: 'docs',
              label: (
                <DocsLink>
                  Docs
                  <ExportOutlined />
                </DocsLink>
              ),
            },
          ]}
        />
        <Login />
      </StyledHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{chainId ? children : null}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

Layout.propTypes = {
  children: PropTypes.element,
};

Layout.defaultProps = {
  children: null,
};

const LayoutWithWalletProvider = (props) => (
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <Layout {...props} />
    </WalletProvider>
  </ConnectionProvider>
);

LayoutWithWalletProvider.propTypes = { children: PropTypes.element };
LayoutWithWalletProvider.defaultProps = { children: null };
export default LayoutWithWalletProvider;
