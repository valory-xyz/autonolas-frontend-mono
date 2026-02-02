import { Menu } from 'antd';
import type { MenuItemType } from 'antd/es/menu/interface';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';

const items: MenuItemType[] = [
  { label: 'Live staking contracts', key: 'contracts' },
  { label: 'AI Agents', key: 'agents' },
  { label: 'Docs', key: 'docs' },
];

export const NavigationMenu: FC = () => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState('');
  const { pathname } = router;

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      setSelectedMenu(pathname);
    }
  }, [pathname]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    const path = `/${key}`;
    router.push(path);
    setSelectedMenu(path);
  };

  return (
    <Menu
      theme="light"
      mode="horizontal"
      selectedKeys={selectedMenu ? [selectedMenu.split('/')[1]] : []}
      items={items}
      onClick={handleMenuItemClick}
    />
  );
};
