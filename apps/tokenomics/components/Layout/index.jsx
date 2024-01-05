import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { Layout, Menu } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { COLOR } from '@autonolas/frontend-library';

import { useHelpers } from 'common-util/hooks/useHelpers';
import Login from '../Login';
import Footer from './Footer';
import { CustomLayout, Logo, DocsLink } from './styles';

const LogoSvg = dynamic(() => import('common-util/SVGs/logo'));

const { Header, Content } = Layout;

const StyledHeader = styled(Header)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
`;

const NavigationBar = ({ children }) => {
  const router = useRouter();
  const { chainId } = useHelpers();

  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (router.pathname) {
      const name = router.pathname.split('/')[1];
      setSelectedMenu(name || 'veolas');
    }
  }, [router.pathname]);

  const handleMenuItemClick = ({ key }) => {
    if (key === 'docs') {
      window.open(
        'https://docs.autonolas.network/protocol/tokenomics/',
        '_blank',
      );
    } else {
      router.push(`/${key}`);
      setSelectedMenu(key);
    }
  };

  return (
    <CustomLayout pathname={router.pathname}>
      <StyledHeader>
        <div className="column-1">
          <Logo data-testid="tokenomics-logo">
            <LogoSvg />
            <span>Tokenomics</span>
          </Logo>
        </div>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
          onClick={handleMenuItemClick}
          items={[
            { key: 'donate', label: 'Donate' },
            { key: 'dev-incentives', label: 'Dev Rewards' },
            { key: 'bonding-products', label: 'Bonding Products' },
            { key: 'my-bonds', label: 'My Bonds' },
            {
              key: 'docs',
              label: (
                <DocsLink>
                  Docs
                  <ExportOutlined />
                </DocsLink>
              ),
            },
          ]}
        />
        <Login />
      </StyledHeader>

      <Content className="site-layout">
        <div className="site-layout-background">
          {chainId ? children : null}
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
