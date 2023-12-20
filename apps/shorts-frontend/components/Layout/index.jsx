import { useRouter } from 'next/router';
import { Layout, Button, ConfigProvider } from 'antd';
import PropTypes from 'prop-types';

import { GREEN_THEME } from 'util/theme';
import Image from 'next/image';
import Login from '../Login';
import Footer from './Footer';
import { CustomLayout } from './styles';

const { Header, Content } = Layout;

const NavigationBar = ({ children }) => {
  const router = useRouter();

  return (
    <CustomLayout pathname={router.pathname}>
      <Header style={{ justifyContent: 'space-between' }}>
        <div className="column-1">
          <Image src="/images/logo.png" alt="logo" width={280} height={61} />
        </div>

        <div className="column-2">
          {router.pathname.includes('requests') && (
            <ConfigProvider theme={GREEN_THEME}>
              <Button type="primary" onClick={() => router.push('/')}>
                New request
              </Button>
            </ConfigProvider>
          )}
          <Login />
        </div>
      </Header>

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
