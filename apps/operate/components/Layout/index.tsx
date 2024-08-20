import { Layout as AntdLayout } from 'antd';
import { FC, ReactNode } from 'react';

import { Footer } from './Footer';
import { LogoSvg } from './Logos';
import { CustomLayout, Logo, OlasHeader } from './styles';
import { NavigationMenu } from './Menu';

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
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};
