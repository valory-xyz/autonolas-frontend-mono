import { Menu, type MenuProps } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';

const items: MenuProps['items'] = [
  { label: 'Staking contracts', key: 'contracts' },
  { label: 'Proposals', key: 'proposals' },
  { label: 'veOLAS', key: 'veolas' },
  { label: 'Donate', key: 'donate' },
  { label: 'Epoch', key: 'epoch' },
  { label: 'Docs', key: 'docs' },
];

interface MenuInstanceProps {
  selectedMenu: string;
  handleMenuItemClick: (key: string) => void;
  mode: 'horizontal' | 'vertical';
}

const MenuInstance: FC<MenuInstanceProps> = ({ selectedMenu, handleMenuItemClick, mode }) => {
  return (
    <Menu
      theme="light"
      mode={mode}
      selectedKeys={selectedMenu ? [selectedMenu.split('/')[1]] : []}
      items={items}
      onClick={({ key }) => handleMenuItemClick(String(key))}
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

  const handleMenuItemClick = (key: string) => {
    const path = `/${key}`;
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
