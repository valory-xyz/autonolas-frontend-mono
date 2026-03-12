import { Layout as AntdLayout } from 'antd';
import { FC, ReactNode } from 'react';

import { Footer } from './Footer';
import { LogoSvg } from './Logos';
import { CustomLayout, Logo, OlasHeader } from './styles';
import { NavigationMenu } from './Menu';
import { NavDropdown } from 'libs/ui-components/src';

const { Content } = AntdLayout;

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <CustomLayout>
      <OlasHeader>
        <div className="header-left-content">
          <Logo href="/">
            <LogoSvg />
          </Logo>
          <NavDropdown currentSite="operate" />
        </div>
        <NavigationMenu />
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};
