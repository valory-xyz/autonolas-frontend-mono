import { MenuOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';

const ExternalLink = ({ href, label }: { href: string; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

const navItems = [
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
    key: 'divider',
    type: 'divider',
  },
  {
    key: 'registry',
    label: <ExternalLink label="Registry" href="https://registry.olas.network/" />,
  },
  {
    key: 'divider',
    type: 'divider',
  },
  {
    key: 'olas',
    label: <ExternalLink label="Olas website" href="https://olas.network/" />,
  },
];

export const NavDropdown = ({ currentSite }: { currentSite: string }) => {
  const newNavItems = navItems.map((item) => ({
    ...item,
    disabled: item.key === currentSite,
  }));

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
