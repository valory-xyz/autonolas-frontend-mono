import { ExportOutlined } from '@ant-design/icons';
import { Alert, Flex, Layout, Menu, Tag } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { COLOR } from '@autonolas/frontend-library';

import { useScreen } from 'libs/ui-theme/src';
import { ALL_SUPPORTED_CHAINS } from 'common-util/login/config';
import { getSupportedNetworks } from 'common-util/functions';
import { useHandleRoute } from 'common-util/hooks/useHandleRoute';
import { PAGES_TO_LOAD_WITH_CHAIN_ID } from 'util/constants';
import Login from 'components/Login';
import type { RootState } from 'store/types';

import Footer from './Footer';
import { LogoSvg } from './Logo';
import { SwitchNetworkSelect } from './SwitchNetworkSelect';
import { CustomLayout, Logo, OlasHeader } from './styles';

const { Content } = Layout;

const MENU_ITEMS = [
  { key: 'mechs', label: 'Mechs' },
  {
    key: 'docs',
    label: (
      <Flex gap={4}>
        Learn more
        <ExportOutlined style={{ fontSize: '12px' }} />
      </Flex>
    ),
  },
];

const NavigationBar = ({ children = null }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { chainId } = useSelector((state: RootState) => state?.setup);
  const { pathname } = router;
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const { isMobile } = useScreen();

  useHandleRoute();

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[2];
      setSelectedMenu(name || MENU_ITEMS[0].key);
    }
  }, [pathname]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    if (key === 'docs') {
      window.open('https://olas.network/mech-marketplace', '_blank', 'noopener,noreferrer');
      return;
    }

    if (PAGES_TO_LOAD_WITH_CHAIN_ID.includes(`/${key}`)) {
      const chain = ALL_SUPPORTED_CHAINS.find((id) => chainId);
      if (!chain) return;
      router.push(`/${chain.networkName}/${key}`);
    } else {
      router.push(`/${key}`);
    }

    setSelectedMenu(key);
  };

  return (
    <CustomLayout>
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
          disabledOverflow={isMobile}
        />

        <SwitchNetworkSelect />
        <Login />
      </OlasHeader>

      <Content className="site-layout">
        <div className="site-layout-background">
          {chainId && !getSupportedNetworks().includes(Number(chainId)) && (
            <Alert
              showIcon
              message={
                <>
                  You are on a wrong network. Please switch to Gnosis Chain network or&nbsp;
                  <a href="https://discord.com/invite/z2PT65jKqQ" target="_blank" rel="noreferrer">
                    join our Discord
                  </a>
                  &nbsp;to request other networks.
                </>
              }
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

export default NavigationBar;
