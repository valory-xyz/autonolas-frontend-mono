import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import {
  Alert, Layout, Menu, Tag,
} from 'antd';
import PropTypes from 'prop-types';
import { getSupportedNetworks } from 'common-util/functions';
import { COLOR } from '@autonolas/frontend-library';
import Login from '../Login';
import Footer from './Footer';
import { CustomLayout, Logo } from './styles';

const LogoSvg = dynamic(() => import('common-util/SVGs/logo'));

const { Header, Content } = Layout;

const NavigationBar = ({ children }) => {
  const router = useRouter();

  const chainId = useSelector((state) => state?.setup?.chainId);
  const { pathname } = router;
  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[1];
      setSelectedMenu(name || 'registry');
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
      <Header>
        <div className="column-1">
          <Logo data-testid="member-logo">
            <LogoSvg />
            <span className="title-text">Mech</span>
            &nbsp;
            <Tag color={COLOR.RED}>Beta</Tag>
          </Logo>
        </div>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
          onClick={handleMenuItemClick}
          items={[
            { key: 'registry', label: 'Registry' },
            { key: 'factory', label: 'Factory' },
            { key: 'mech', label: 'Mech' },
            { key: 'docs', label: 'Docs' },
          ]}
        />
        <Login />
      </Header>

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
