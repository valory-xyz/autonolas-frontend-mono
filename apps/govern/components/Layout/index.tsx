import { Alert, Layout as AntdLayout } from 'antd';
import { FC, ReactNode } from 'react';

import { useScreen } from 'libs/ui-theme/src';

import { LoginV2 } from 'components/Login';

import { Balance } from './Balance';
import { Footer } from './Footer';
import { LogoSvg } from './Logos';
import { NavigationMenu } from './Menu';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';

const { Content } = AntdLayout;

interface LayoutProps {
  children?: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const { isMobile } = useScreen();

  return (
    <CustomLayout>
      <OlasHeader>
        <Logo href="/">
          <LogoSvg />
        </Logo>
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
            message="This page is not optimized for mobile. For best experience, please come back on desktop."
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
