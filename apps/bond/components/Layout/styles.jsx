import { Layout } from 'antd';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from 'libs/ui-theme/src';

export const CustomLayout = styled(Layout)`
  min-height: 100vh;

  /* layout */
  .site-layout {
    padding: 0 2rem;
    margin-top: 56px;
    + div {
      padding: 1.5rem 32px;
    }
  }

  .site-layout-background {
    padding: 24px 0;
    min-height: calc(100vh - 8.5rem);
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

  /* radio-button for grouping */
  .choose-type-group.ant-typography {
    display: flex;
    align-items: center;
    .ant-radio-group {
      margin-left: 2rem;
      border: 1px solid ${COLOR.BORDER_GREY};
      padding: 2px 16px;
    }
  }

  .ant-table {
    .ant-table-thead > tr > th.ant-table-cell {
      background-color: ${COLOR.WHITE};
    }
    .ant-table-tbody > tr > td {
      padding: 10px;
    }
  }

  ${MEDIA_QUERY.tablet} {
    .ant-layout-header {
      position: relative;
      flex-direction: column;
      height: auto;
      padding: 0;
    }
    .site-layout-background {
      padding: 1rem 0;
      min-height: calc(100vh - 20rem);
    }
    .site-layout {
      margin-top: 0;
    }
    .ant-menu.ant-menu-horizontal {
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

export const DocsLink = styled.div`
  svg {
    width: 12px;
    margin-left: 4px;
    margin-bottom: -1px;
  }
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: left;
  max-width: 248px;
  margin-left: 0.5rem;
  margin-right: 1.5rem;
  font-size: 34px;
  color: ${COLOR.PRIMARY};
  cursor: pointer;
  svg {
    flex: 60px;
  }
  span {
    margin-left: 1rem;
    font-weight: bold;
    line-height: 1.2;
  }
`;
