import {
  FileTextOutlined,
  NotificationOutlined,
  TrophyOutlined,
  // XOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { CustomMenu } from './styles';

const menuItems = [
  { key: 'leaderboard', label: 'Leaderboard', icon: <TrophyOutlined /> },
  { key: 'staking', label: 'Staking', icon: <NotificationOutlined /> },
  // { key: 'post', label: 'Post', icon: <XOutlined /> },
  { key: 'docs', label: 'Docs', icon: <FileTextOutlined /> },
];

type MenuProps = {
  isBannerVisible: boolean;
  onBannerClose: () => void;
  isMenuVisible: boolean;
  onMenuClose: () => void;
  /**
   * Passed in rather than read from `useBreakpoint` here, so the sidebar makes the same call as
   * the Layout and both agree with what the server rendered.
   */
  isDesktop: boolean;
};

export const Menu = ({
  isBannerVisible,
  onBannerClose,
  isMenuVisible,
  onMenuClose,
  isDesktop,
}: MenuProps) => {
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
    if (!isDesktop) {
      onMenuClose();
    }
  };

  if (isDesktop || isMenuVisible)
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
