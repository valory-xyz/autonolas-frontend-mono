import { Layout as AntdLayout } from 'antd';
import dynamic from 'next/dynamic';
import { FC, ReactNode } from 'react';

import { useScreen } from '@autonolas/frontend-library';

import { LogoIconSvg, LogoSvg } from './Logos';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';

const Login = dynamic(() => import('../Login'), { ssr: false });

const Balance = dynamic(() => import('./Balance'), { ssr: false });
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
      <OlasHeader>
        <Logo data-testid="protocol-logo">
          {isMobile ? <LogoIconSvg /> : <LogoSvg />}
        </Logo>
        <NavigationMenu />
        <RightMenu>
          <Balance/>
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

export default Layout;
