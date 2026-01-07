import { Flex, Layout } from 'antd';
import styled from 'styled-components';
import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { NavDropdown } from 'libs/ui-components/src';
import Link from 'next/link';
import { CustomLayout } from './styles';
import { Logo } from '../Branding/Logo';
import Footer from './Footer';

const { Header, Content } = Layout;

const StyledHeader = styled(Header)`
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  padding: 20px !important;
`;

const NavigationBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <CustomLayout>
      <StyledHeader>
        <Flex gap={16}>
          <Link href="/" className="logo-link">
            <Logo />
          </Link>
          <NavDropdown currentSite="docs" />
        </Flex>
      </StyledHeader>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

export default NavigationBar;
