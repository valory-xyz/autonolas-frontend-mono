import { Layout as AntdLayout } from 'antd';
import { FC, ReactNode } from 'react';

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
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};
