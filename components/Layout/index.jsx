import { Layout, Menu } from 'antd';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { COLOR } from '@autonolas/frontend-library';
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
  { key: 'paths', label: 'Paths' },
  { key: 'dev-incentives', label: 'Dev Rewards' },
];

const NavigationBar = ({ children }) => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (router.pathname) {
      const name = router.pathname.split('/')[1];
      setSelectedMenu(name || items[0].key);
    }
  }, [router.pathname]);

  const handleMenuItemClick = ({ key }) => {
    router.push(`/${key}`);
    setSelectedMenu(key);
  };

  return (
    <CustomLayout>
      <StyledHeader>
        <Link href="/" className="logo-link">
          <Logo />
        </Link>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
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

NavigationBar.propTypes = {
  children: PropTypes.element,
};

NavigationBar.defaultProps = {
  children: null,
};

export default NavigationBar;
