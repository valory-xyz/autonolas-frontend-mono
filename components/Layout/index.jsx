import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  Alert, Layout, Menu, Tag, Flex,
} from 'antd';
import PropTypes from 'prop-types';
import { getSupportedNetworks } from 'common-util/functions';
import { COLOR } from '@autonolas/frontend-library';
import { LogoSvg } from './Logo';
import Login from '../Login';
import Footer from './Footer';
import { CustomLayout, OlasHeader, Logo } from './styles';

const { Content } = Layout;

const MENU_ITEMS = [
  { key: 'mechs', label: 'Mechs' },
  { key: 'docs', label: 'Docs' },
  {
    key: 'factory',
    label: (
      <Flex gap={6} align="center">
        Factory
        <Tag bordered={false}>Legacy</Tag>
      </Flex>
    ),
  },
];

const NavigationBar = ({ children }) => {
  const router = useRouter();

  const chainId = useSelector((state) => state?.setup?.chainId);
  const { pathname } = router;
  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[1];
      setSelectedMenu(name || MENU_ITEMS[0].key);
    }
  }, [pathname]);

  const handleMenuItemClick = ({ key }) => {
    if (key === 'docs') {
      window.open('https://docs.autonolas.network/product/mechkit/', '_blank', 'noopener,noreferrer');
      return;
    }

    router.push(`/${key}`);
    setSelectedMenu(key);
  };

  return (
    <CustomLayout pathname={router.pathname}>
      <OlasHeader>
        <div className="column-1">
          <Logo href="/">
            <LogoSvg />
            <Tag color={COLOR.RED}>Beta</Tag>
          </Logo>
        </div>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
          onClick={handleMenuItemClick}
          items={MENU_ITEMS}
        />
        <Login />
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">
          {chainId && !getSupportedNetworks().includes(Number(chainId)) && (
            <Alert
              showIcon
              message={(
                <>
                  You are on a wrong network. Please switch to Gnosis Chain
                  network or&nbsp;
                  <a
                    href="https://discord.com/invite/z2PT65jKqQ"
                    target="_blank"
                    rel="noreferrer"
                  >
                    join our Discord
                  </a>
                  &nbsp;to request other networks.
                </>
              )}
              type="error"
              className="mt-12"
            />
          )}
          {children}
        </div>
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
