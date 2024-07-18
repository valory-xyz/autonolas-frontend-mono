import { Layout } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

export const CustomLayout = styled(Layout)`
  min-height: 100vh;

  .site-layout {
    padding: 0 24px;
    margin-top: 64px;
  }
  .site-layout-background {
    padding: 40px 0;
    min-height: calc(100vh - 140px);
  }
`;

export const Logo = styled(Link)`
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-right: 1rem;
  > span {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
`;

export const RightMenu = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-left: auto;
`;

export const OlasHeader = styled(Layout.Header)`
  padding: 0 40px;
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  display: flex;
  align-items: center;
`;
