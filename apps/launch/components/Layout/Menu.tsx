import { Menu } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useMemo, useState } from 'react';

import { PAGES_TO_LOAD_WITH_CHAIN_ID } from 'common-util/config/supportedChains';
import { URL } from 'common-util/constants/urls';
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
      { label: 'Path', key: 'path', path: `/path` },
      {
        label: 'My staking contracts',
        key: URL.myStakingContracts,
        path: `/${networkName || 'ethereum'}/${URL.myStakingContracts}`,
      },
      { label: 'Docs', key: 'docs', path: '/docs' },
    ],
    [networkName],
  );

  const selectedMenuKey = useMemo(() => {
    if (!selectedMenu) return [];

    if (selectedMenu.includes(URL.myStakingContracts)) {
      return [URL.myStakingContracts];
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
          path: PAGES_TO_LOAD_WITH_CHAIN_ID.includes(key)
            ? `/${networkName || 'ethereum'}/${key}`
            : `/${key}`,
        })
      }
    />
  );
};

type NavigationMenuProps = Record<string, never>;

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
