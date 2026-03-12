import { Button, Dropdown, Menu } from 'antd';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import { useScreen } from 'libs/ui-theme/src';

import { useHelpers } from 'common-util/hooks';

const items = [
  { label: 'Agent Blueprints', key: 'agent-blueprints' },
  { label: 'Components', key: 'components' },
];

const serviceItem = [{ label: 'AI Agents', key: 'ai-agents' }];

const MenuInstance = ({
  selectedMenu,
  handleMenuItemClick,
  mode,
}: {
  selectedMenu: string;
  handleMenuItemClick: (e: { key: string }) => void;
  mode: 'horizontal' | 'vertical';
}) => {
  const { isL1Network, isSvm } = useHelpers();

  const navItems = useMemo(() => {
    // only show services for svm
    if (isSvm) return serviceItem;

    return isL1Network ? [...serviceItem, ...items] : serviceItem;
  }, [isL1Network, isSvm]);

  return (
    <Menu
      theme="light"
      mode={mode}
      selectedKeys={selectedMenu ? [selectedMenu] : []}
      items={navItems}
      onClick={handleMenuItemClick}
    />
  );
};

MenuInstance.propTypes = {
  selectedMenu: PropTypes.string,
  handleMenuItemClick: PropTypes.func.isRequired,
  mode: PropTypes.string,
};

MenuInstance.defaultProps = {
  selectedMenu: '',
  mode: 'horizontal',
};

const NavigationMenu = () => {
  const { chainName } = useHelpers();
  const router = useRouter();
  const { isMobile, isTablet } = useScreen();
  const [selectedMenu, setSelectedMenu] = useState('');
  const { pathname } = router;
  const [menuVisible, setMenuVisible] = useState(false);

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[2];
      setSelectedMenu(name || '');
    }
  }, [pathname]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    router.push(`/${chainName}/${key}`);
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
        <Button size="large" onClick={handleMenuButtonClick}>
          Menu
        </Button>
      </Dropdown>
    );
  }

  return <MenuInstance selectedMenu={selectedMenu} handleMenuItemClick={handleMenuItemClick} />;
};

export default NavigationMenu;
