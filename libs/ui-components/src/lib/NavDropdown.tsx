import { MenuOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps } from 'antd';
import type { ItemType, MenuItemType } from 'antd/es/menu/interface';

const ExternalLink = ({ href, label }: { href: string; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

const navItems: MenuProps['items'] = [
  { key: 'bond', label: <ExternalLink label="Bond" href="https://bond.olas.network/" /> },
  {
    key: 'build',
    label: <ExternalLink label="Build" href="https://build.olas.network/" />,
  },
  {
    key: 'contribute',
    label: <ExternalLink label="Contribute" href="https://contribute.olas.network/" />,
  },
  {
    key: 'govern',
    label: <ExternalLink label="Govern" href="https://govern.olas.network/" />,
  },
  {
    key: 'launch',
    label: <ExternalLink label="Launch" href="https://launch.olas.network/" />,
  },
  {
    key: 'operate',
    label: <ExternalLink label="Operate" href="https://operate.olas.network/" />,
  },
  {
    key: 'divider-1',
    type: 'divider',
  },
  {
    key: 'docs',
    label: <ExternalLink label="Docs" href="https://docs.olas.network/" />,
  },
  {
    key: 'mech-marketplace',
    label: <ExternalLink label="Mech Marketplace" href="https://marketplace.olas.network/" />,
  },
  {
    key: 'divider-2',
    type: 'divider',
  },
  {
    key: 'olas',
    label: <ExternalLink label="Olas website" href="https://olas.network/" />,
  },
];

export const NavDropdown = ({ currentSite }: { currentSite: string }) => {
  const newNavItems: MenuProps['items'] = navItems.map((item): ItemType => {
    if (item && 'type' in item && item.type === 'divider') {
      return item;
    }
    if (item && 'key' in item) {
      return {
        ...(item as MenuItemType),
        disabled: item.key === currentSite,
      };
    }
    return item;
  });

  return (
    <Dropdown
      menu={{
        items: newNavItems,
        selectedKeys: [currentSite],
      }}
      trigger={['click']}
    >
      <Button className="nav-button">
        <MenuOutlined />
      </Button>
    </Dropdown>
  );
};
