import { FC, ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Layout as AntdLayout } from 'antd';

import { VM_TYPE, useScreen } from '@autonolas/frontend-library';

import { getSvmEndpoint } from '../../common-util/Login/config';
import { LogoIconSvg } from './Logos';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';

const Login = dynamic(() => import('../Login'), { ssr: false });
const NavigationMenu = dynamic(() => import('./Menu'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });

const { Content } = AntdLayout;

interface LayoutProps {
  children?: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { isMobile } = useScreen();

  return (
    <CustomLayout>
      <OlasHeader isMobile={isMobile}>
        <Logo data-testid="protocol-logo" isMobile={isMobile}>
          {<LogoIconSvg />} &nbsp; GOVERN
        </Logo>
        <NavigationMenu />
        <RightMenu>
          <Login />
        </RightMenu>
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

const LayoutWithWalletProvider: FC<LayoutProps> = (props) => {
  const chainName = useSelector((state: any) => state?.setup?.chainName);
  const vmType = useSelector((state: any) => state?.setup?.vmType);
  const endpoint = getSvmEndpoint(chainName);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint || ''}>
      <WalletProvider wallets={wallets} autoConnect={vmType === VM_TYPE.SVM}>
        <Layout {...props}>{props.children}</Layout>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default LayoutWithWalletProvider;
