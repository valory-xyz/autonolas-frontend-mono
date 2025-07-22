import { MenuOutlined } from '@ant-design/icons';
import {
  FileTextOutlined,
  NotificationOutlined,
  TrophyOutlined,
  XOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Grid } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { CustomMenu } from './styles';

const menuItems = [
  { key: 'leaderboard', label: 'Leaderboard', icon: <TrophyOutlined /> },
  { key: 'staking', label: 'Staking', icon: <NotificationOutlined /> },
  { key: 'post', label: 'Post', icon: <XOutlined /> },
  { key: 'docs', label: 'Docs', icon: <FileTextOutlined /> },
];

const ExternalLink = ({ href, label }: { href: string; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

// TODO: use from common lib.
const navItems = [
  { key: 'bond', label: <ExternalLink label="Bond" href="https://bond.olas.network/" /> },
  {
    key: 'build',
    label: <ExternalLink label="Build" href="https://build.olas.network/" />,
  },
  {
    key: 'contribute',
    label: <ExternalLink label="Contribute" href="https://contribute.olas.network/" />,
    disabled: true,
  },
  {
    key: 'govern',
    label: <ExternalLink label="Govern" href="https://govern.olas.network/" />,
  },
  {
    key: 'launch',
    label: <ExternalLink label="Launch" href="https://launch.olas.network/" />,
  },
  {
    key: 'operate',
    label: <ExternalLink label="Operate" href="https://operate.olas.network/" />,
  },
  {
    key: 'divider',
    type: 'divider',
  },
  {
    key: 'registry',
    label: <ExternalLink label="Registry" href="https://registry.olas.network/" />,
  },
  {
    key: 'divider',
    type: 'divider',
  },
  {
    key: 'olas',
    label: <ExternalLink label="Olas website" href="https://olas.network/" />,
  },
];

const { useBreakpoint } = Grid;

const BurgerMenuButton = styled(Button)`
  padding-left: 8px;
  padding-right: 8px;
  margin-top: auto;
  margin-bottom: auto;
`;

export const NavDropdown = () => (
  <Dropdown
    menu={{
      items: navItems,
      selectedKeys: ['contribute'],
    }}
    trigger={['click']}
  >
    <BurgerMenuButton>
      <MenuOutlined />
    </BurgerMenuButton>
  </Dropdown>
);

type MenuProps = {
  isBannerVisible: boolean;
  onBannerClose: () => void;
  isMenuVisible: boolean;
  onMenuClose: () => void;
};

export const Menu = ({ isBannerVisible, onBannerClose, isMenuVisible, onMenuClose }: MenuProps) => {
  const screens = useBreakpoint();
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState('leaderboard');
  const { pathname } = router;

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[1];
      setSelectedMenu(name || 'leaderboard');

      if (pathname.includes('staking')) {
        onBannerClose();
      }
    }
  }, [pathname, onBannerClose]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    router.push(`/${key}`);
    setSelectedMenu(key);
    if (!screens.md) {
      onMenuClose();
    }
  };

  if (screens.md || isMenuVisible)
    return (
      <CustomMenu
        theme="light"
        mode="vertical"
        defaultSelectedKeys={[selectedMenu]}
        selectedKeys={[selectedMenu]}
        items={menuItems}
        onClick={handleMenuItemClick}
        $isBannerVisible={isBannerVisible}
      />
    );

  return null;
};
