import { Layout as AntdLayout } from 'antd';
import dynamic from 'next/dynamic';
import { FC, ReactNode } from 'react';

import { LoginV2 } from 'components/Login';

import { LogoSvg } from './Logos';
import { SwitchNetworkSelect } from './SwitchNetworkSelect/SwitchNetworkSelect';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';

const NavigationMenu = dynamic(() => import('./Menu'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });

const { Content } = AntdLayout;

interface LayoutProps {
  children?: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <CustomLayout>
      <OlasHeader>
        <Logo href="/">
          <LogoSvg />
        </Logo>
        <NavigationMenu />
        <RightMenu>
          <SwitchNetworkSelect />
          <LoginV2 />
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
