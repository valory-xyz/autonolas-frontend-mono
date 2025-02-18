import { Alert, Layout as AntdLayout } from 'antd';
import { FC, ReactNode } from 'react';

import { useScreen } from 'libs/ui-theme/src';

import { LoginV2 } from 'components/Login';

import { Balance } from './Balance';
import { Footer } from './Footer';
import { LogoSvg } from './Logos';
import { NavigationMenu } from './Menu';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';
import { NavDropdown } from 'libs/ui-components/src';

const { Content } = AntdLayout;

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const { isMobile } = useScreen();

  return (
    <CustomLayout>
      <OlasHeader>
        <div className="header-left-content">
          <Logo href="/">
            <LogoSvg />
          </Logo>
          <NavDropdown currentSite="govern" />
        </div>
        <NavigationMenu />
        <RightMenu>
          <Balance />
          <LoginV2 />
        </RightMenu>
      </OlasHeader>

      <Content className="site-layout">
        {isMobile && (
          <Alert
            className="mt-16"
            message="This page is not optimized for mobile. For the best experience, please come back on desktop."
            showIcon
            type="warning"
          />
        )}

        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};
