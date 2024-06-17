import { Menu } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useMemo, useState } from 'react';

import { PAGES_TO_LOAD_WITH_CHAIN_ID } from 'common-util/config/supportedChains';
import { useAppSelector } from 'store/index';

type MenuItem = {
  label: string;
  key: string;
  path: string;
};

type MenuInstanceProps = {
  selectedMenu: string;
  handleMenuItemClick: (item: MenuItem) => void;
  mode: 'horizontal' | 'vertical';
};

const MenuInstance: FC<MenuInstanceProps> = ({ selectedMenu, handleMenuItemClick, mode }) => {
  const { networkName } = useAppSelector((state) => state.network);

  const items: MenuItem[] = useMemo(
    () => [
      {
        label: 'My staking contracts',
        key: 'my-staking-contracts',
        path: `/${networkName}/my-staking-contracts`,
      },
      { label: 'Paths', key: 'paths', path: `/paths` },
    ],
    [networkName],
  );

  const selectedMenuKey = useMemo(() => {
    if (!selectedMenu) return [];

    if (selectedMenu.includes('my-staking-contracts')) {
      return ['my-staking-contracts'];
    }

    return [selectedMenu.split('/')[1]];
  }, [selectedMenu]);

  return (
    <Menu
      theme="light"
      mode={mode}
      selectedKeys={selectedMenuKey}
      items={items}
      onClick={({ key }) =>
        handleMenuItemClick({
          label: '',
          key,
          path: PAGES_TO_LOAD_WITH_CHAIN_ID.includes(key) ? `/${networkName}/${key}` : `/${key}`,
        })
      }
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
    if (!path) return;

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
