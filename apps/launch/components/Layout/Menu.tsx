import { Menu } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';

interface MenuItem {
  label: string;
  key: string;
  path: string;
}

const items: MenuItem[] = [];

interface MenuInstanceProps {
  selectedMenu: string;
  handleMenuItemClick: (item: MenuItem) => void;
  mode: 'horizontal' | 'vertical';
}

const MenuInstance: FC<MenuInstanceProps> = ({ selectedMenu, handleMenuItemClick, mode }) => {
  return (
    <Menu
      theme="light"
      mode={mode}
      selectedKeys={selectedMenu ? [selectedMenu.split('/')[1]] : []}
      items={items}
      onClick={({ key }) => handleMenuItemClick({ label: '', key, path: `/${key}` })}
    />
  );
};

interface NavigationMenuProps {}

const NavigationMenu: FC<NavigationMenuProps> = () => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState('');
  const { pathname } = router;

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      setSelectedMenu(pathname);
    }
  }, [pathname]);

  const handleMenuItemClick = ({ path }: MenuItem) => {
    router.push(path);
    setSelectedMenu(path);
  };

  return (
    <MenuInstance
      selectedMenu={selectedMenu}
      handleMenuItemClick={handleMenuItemClick}
      mode="horizontal"
    />
  );
};

export default NavigationMenu;
