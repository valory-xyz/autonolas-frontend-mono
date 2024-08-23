import { Menu } from 'antd';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';


const items: MenuItemType[] = [
  { label: 'Live staking contracts', key: 'contracts' },
  { label: 'Agents', key: 'agents' },
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

  const handleMenuItemClick = ({ key }: MenuItemType) => {
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
