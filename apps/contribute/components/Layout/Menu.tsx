import {
  FileTextOutlined,
  NotificationOutlined,
  TrophyOutlined,
  XOutlined,
} from '@ant-design/icons';
import { Grid } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { CustomMenu } from './styles';

const menuItems = [
  { key: 'leaderboard', label: 'Leaderboard', icon: <TrophyOutlined /> },
  { key: 'staking', label: 'Staking', icon: <NotificationOutlined /> },
  { key: 'post', label: 'Post', icon: <XOutlined /> },
  { key: 'docs', label: 'Docs', icon: <FileTextOutlined /> },
];

const { useBreakpoint } = Grid;

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
