import { Menu } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';

interface MenuItem {
  label: string;
  key: string;
  path: string;
}

const items: MenuItem[] = [
  { label: 'Staking contracts', key: 'contracts', path: '/contracts' },
  { label: 'Proposals', key: 'proposals', path: '/proposals' },
  { label: 'veOLAS', key: 'veolas', path: '/veolas' },
  { label: 'Donate', key: 'donate', path: '/donate' },
  { label: 'Epoch', key: 'epoch', path: '/epoch' },
  { label: 'Docs', key: 'docs', path: '/docs' },
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
      selectedKeys={selectedMenu ? [selectedMenu.split('/')[1]] : []}
      items={items}
      onClick={({ key }) => handleMenuItemClick({ label: '', key, path: `/${key}` })}
    />
  );
};

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
