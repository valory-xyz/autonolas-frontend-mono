import styled from 'styled-components';
import { Layout } from 'antd';
import { COLOR, MEDIA_QUERY } from '@autonolas-frontend-mono/ui-theme';

export const CustomLayout = styled(Layout)`
  margin-bottom: 8rem;
  min-height: 100vh;
  background-color: ${COLOR.WHITE};

  .site-layout {
    padding: 60px 0 24px 0;
  }

  .logo-link {
    display: flex;
  }

  .ant-layout-header {
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 1;
    width: 100%;
    height: 64px;
    line-height: 64px;
    padding: 0 2rem;
    gap: 0 16px;
    .ant-menu {
      flex: 1;
      &.ant-menu-horizontal {
        border: none;
      }
      &.ant-menu-horizontal > .ant-menu-item::after,
      .ant-menu-horizontal > .ant-menu-submenu::after {
        border-bottom: none !important;
      }
      .ant-menu-item-selected {
        font-weight: bold;
      }
    }
    ${MEDIA_QUERY.mobileM} {
      &.ant-menu-horizontal {
        line-height: 2;
      }
    }
  }

  ${MEDIA_QUERY.tablet} {
    .ant-layout-header {
      position: relative;
      flex-direction: column;
      height: auto;
      padding: 0;
    }
    .site-layout {
      margin-top: 0;
    }
    .ant-menu.ant-menu-horizontal {
      justify-content: center;
      width: 100%;
    }
  }
  ${MEDIA_QUERY.mobileL} {
    .site-layout {
      padding: 0 1rem;
    }
    .footer-center {
      display: none;
    }
  }
  ${MEDIA_QUERY.mobileM} {
    .ant-layout-header {
      .ant-menu-overflow-item {
        line-height: 2;
      }
    }
  }
`;

export const SubFooter = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0.5rem;
  padding: 2rem 1rem;
  border: 1px solid ${COLOR.GREY_1};
  border-radius: 0px 0px 20px 20px;
  border-top-color: transparent;

  ${MEDIA_QUERY.tablet} {
    position: relative;
    flex-direction: column;
    font-size: 16px;
    padding: 2rem 0.75rem 1.5rem 0.75rem;
  }
`;

export const ContractsInfoContainer = styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  .mech-contract {
    display: flex;
    align-items: center;
  }
  img {
    margin-right: 8px;
  }
`;

export const FooterContainer = styled.div`
  margin-bottom: 8rem;
`;
