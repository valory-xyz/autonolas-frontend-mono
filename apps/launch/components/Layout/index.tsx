import { Layout as AntdLayout } from 'antd';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';

import { URL } from 'common-util/constants/urls';

import { LoginV2 } from '../Login';
import { LogoSvg } from './Logos';
import { SwitchNetworkSelect } from './SwitchNetworkSelect';
import { CustomLayout, Logo, OlasHeader, RightMenu } from './styles';

const NavigationMenu = dynamic(() => import('./Menu'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });

const { Content } = AntdLayout;

interface LayoutProps {
  children?: ReactNode;
}

const pagesWithoutMenu = [URL.nominateContract];

const Layout: FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const isMenuHidden = pagesWithoutMenu.some((page) => router.pathname.includes(page));

  return (
    <CustomLayout>
      {isMenuHidden ? null : (
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
      )}

      <Content className={`site-layout ${isMenuHidden ? 'mt-24' : ''}`}>
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

export default Layout;
