import { Button, Dropdown, Layout, Menu, MenuProps } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import styled from "styled-components";
import { COLOR } from "@autonolas/frontend-library";
import Link from "next/link";
import { Logo } from "components/Branding/Logo";
import { MenuOutlined } from "@ant-design/icons";
import Footer from "./Footer";
import Login from "./Login";
import { CustomLayout } from "./styles";

const { Header, Content } = Layout;

const StyledHeader = styled(Header)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  padding: 20px !important;
`;

const BurgerMenuButton = styled(Button)`
  padding: 3px;
  margin-top: auto;
  margin-bottom: auto;
  width: 32px;
  height: 32px;
`;

const HeaderLeftContent = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
`;

const ExternalLink = ({
  href = "",
  label = null,
}: {
  href: string;
  label: React.ReactNode;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

const items = [
  { key: "paths", label: "Paths" },
  { key: "dev-incentives", label: "Dev Rewards" },
  { key: "opportunities", label: "Opportunities" },
];

const navItems = [
  {
    key: "bond",
    label: <ExternalLink label="Bond" href="https://bond.olas.network/" />,
  },
  {
    key: "build",
    label: <span>Build</span>,
    disabled: true,
  },
  {
    key: "contribute",
    label: (
      <ExternalLink
        label="Contribute"
        href="https://contribute.olas.network/"
      />
    ),
  },
  {
    key: "govern",
    label: <ExternalLink label="Govern" href="https://govern.olas.network/" />,
  },
  {
    key: "launch",
    label: <ExternalLink label="Launch" href="https://launch.olas.network/" />,
  },
  {
    key: "operate",
    label: (
      <ExternalLink label="Operate" href="https://operate.olas.network/" />
    ),
  },
  {
    type: "divider",
  },
  {
    key: "registry",
    label: (
      <ExternalLink label="Registry" href="https://registry.olas.network/" />
    ),
  },
  {
    type: "divider",
  },
  {
    key: "olas",
    label: <ExternalLink label="Olas website" href="https://olas.network/" />,
  },
];

const NavDropdown = () => (
  <Dropdown
    menu={{
      items: navItems as MenuProps["items"],
      selectedKeys: ["build"],
    }}
    trigger={["click"]}
  >
    <BurgerMenuButton>
      <MenuOutlined />
    </BurgerMenuButton>
  </Dropdown>
);

const NavigationBar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  // to set default menu on first render
  useEffect(() => {
    if (router.pathname) {
      const name = router.pathname.split("/")[1];
      setSelectedMenu(name || items[0].key);
    }
  }, [router.pathname]);

  const handleMenuItemClick = ({ key }: { key: string }) => {
    router.push(`/${key}`);
    setSelectedMenu(key);
  };

  return (
    <CustomLayout>
      <StyledHeader>
        <HeaderLeftContent>
          <Link href="/" className="logo-link">
            <Logo />
          </Link>
          <NavDropdown />
        </HeaderLeftContent>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu || ""]}
          onClick={handleMenuItemClick}
          items={items}
        />
        <Login />
      </StyledHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

NavigationBar.propTypes = {
  children: PropTypes.element,
};

NavigationBar.defaultProps = {
  children: null,
};

export default NavigationBar;
