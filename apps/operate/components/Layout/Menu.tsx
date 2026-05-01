import { Menu } from 'antd';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
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

  const handleMenuItemClick = ({ key }: MenuItemType) => {
    // antd's MenuItemType.key is `React.Key` (string | number); React 19's
    // stricter typings flag template-literal interpolation of a value that
    // could (theoretically) be a symbol. Wrap in String() to satisfy the
    // narrower type. Behaviour identical for string/number keys.
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
