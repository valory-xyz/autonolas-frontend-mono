import { Button, Dropdown, Menu } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState, FC } from 'react';

import { useScreen } from '@autonolas/frontend-library';

interface MenuItem {
  label: string;
  key: string;
}

const items: MenuItem[] = [
  { label: 'Staking Allocation', key: '/allocation' },
  { label: 'Staking Contracts', key: '/contracts' },
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
  const { isMobile, isTablet } = useScreen();
  const [selectedMenu, setSelectedMenu] = useState('');
  const { pathname } = router;
  const [menuVisible, setMenuVisible] = useState(false);

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      setSelectedMenu(pathname);
    }
  }, [pathname]);

  const handleMenuItemClick = ({ key }: MenuItem) => {
    router.push(key);
    setSelectedMenu(key);
    setMenuVisible(false); // close the dropdown menu after item click
  };

  // function to handle menu button click
  const handleMenuButtonClick = () => {
    setMenuVisible(!menuVisible);
  };

  if (isMobile || isTablet) {
    return (
      <Dropdown
        trigger={['click']}
        overlay={
          <MenuInstance
            selectedMenu={selectedMenu}
            handleMenuItemClick={handleMenuItemClick}
            mode="vertical"
          />
        }
      >
        <Button onClick={handleMenuButtonClick}>Menu</Button>
      </Dropdown>
    );
  }

  return (
    <MenuInstance selectedMenu={selectedMenu} handleMenuItemClick={handleMenuItemClick} mode="horizontal" />
  );
};

export default NavigationMenu;
