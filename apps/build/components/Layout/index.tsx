import { Flex, Layout, Menu } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { COLOR } from '@autonolas/frontend-library';
import { NavDropdown } from 'libs/ui-components/src';
import Link from 'next/link';
import { Logo } from 'components/Branding/Logo';
import Footer from './Footer';
import Login from './Login';
import { CustomLayout } from './styles';

const { Header, Content } = Layout;

const StyledHeader = styled(Header)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  padding: 20px !important;
`;

const items = [
  // { key: 'paths', label: 'Paths' },
  { key: 'hire', label: 'Hire an Agent' },
  { key: 'monetize', label: 'Monetize your Agent' },
  { key: 'build', label: 'Build an Agent' },
  { key: 'dev-incentives', label: 'Dev Rewards' },
  // { key: 'opportunities', label: 'Opportunities' },
  { key: 'docs', label: 'Docs' },
];

const DEFAULT_TAB = 'dev-incentives';

const NavigationBar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  // to set default menu on first render
  useEffect(() => {
    if (router.pathname) {
      const name = router.pathname.split('/')[1];
      setSelectedMenu(name || DEFAULT_TAB);
    }
  }, [router.pathname]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    router.push(`/${key}`);
    setSelectedMenu(key);
  };

  return (
    <CustomLayout>
      <StyledHeader>
        <Flex gap={16}>
          <Link href="/" className="logo-link">
            <Logo />
          </Link>
          <NavDropdown currentSite="build" />
        </Flex>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu || DEFAULT_TAB]}
          onClick={handleMenuItemClick}
          items={items}
        />
        <Login />
      </StyledHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

export default NavigationBar;
