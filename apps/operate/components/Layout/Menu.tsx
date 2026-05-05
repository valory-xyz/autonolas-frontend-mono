import { Menu, type MenuProps } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';

const items: MenuProps['items'] = [
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

  const handleMenuItemClick: NonNullable<MenuProps['onClick']> = ({ key }) => {
    const path = `/${String(key)}`;
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
