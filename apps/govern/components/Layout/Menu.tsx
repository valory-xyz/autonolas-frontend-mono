import { Menu } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';

interface MenuItem {
  label: string;
  key: string;
}

const items: MenuItem[] = [
  { label: 'Staking Contracts', key: '/contracts' },
  { label: 'Proposals', key: '/proposals' },
];

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
      selectedKeys={selectedMenu ? [selectedMenu] : []}
      onClick={({ key }) => handleMenuItemClick({ label: '', key })}
    >
      {items.map((item) => (
        <Menu.Item key={item.key}>{item.label}</Menu.Item>
      ))}
    </Menu>
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

  const handleMenuItemClick = ({ key }: MenuItem) => {
    router.push(key);
    setSelectedMenu(key);
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
