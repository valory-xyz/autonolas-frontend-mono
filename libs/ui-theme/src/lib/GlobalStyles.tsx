import { createGlobalStyle } from 'styled-components';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

import { ANTD_COLOR } from './ui-theme';

export const GlobalStyles = createGlobalStyle`
  *,
  :after,
  :before {
    box-sizing: border-box;
  }

  body,
  html {
    width: 100%;
    height: 100%;
    margin: 0;
    font-family: texgyreheros__regular, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  html {
    /* uncomment for dark mode */
    /* background-color: ${COLOR.WHITE}; */
    /* filter: invert(0.85) hue-rotate(180deg); */
  }

  /* common */
  .m-0 {
    margin: 0 !important;
  }
  .mb-0 {
    margin-bottom: 0px;
  }
  .mb-8 {
    margin-bottom: 8px !important;
  }
  .mb-12 {
    margin-bottom: 12px;
  }
  .mb-16 {
    margin-bottom: 16px;
  }
  .mb-24 {
    margin-bottom: 24px !important;
  }
  .mb-48 {
    margin-bottom: 48px;
  }
  .mt-0 {
    margin-top: 0px;
  }
  .mt-4 {
    margin-top: 4px;
  }
  .mt-8 {
    margin-top: 8px;
  }
  .mt-16 {
    margin-top: 16px;
  }
  .mt-24 {
    margin-top: 24px;
  }
  .mt-48 {
    margin-top: 48px;
  }
  .mr-8 {
    margin-right: 8px;
  }
  .mr-16 {
    margin-right: 16px;
  }
  .ml-4 {
    margin-left: 4px;
  }
  .ml-8 {
    margin-left: 8px;
  }
  .p-0 {
    padding: 0 !important;
  }
  .pl-0 {
    padding-left: 0px !important;
  }
  .pt-24 {
    padding-top: 24px;
  }
  .pt-48 {
    padding-top: 48px;
  }

  .text-start {
    text-align: start;
  }
  .text-center {
    text-align: center;
  }
  .text-end {
    text-align: end;
  }

  /* layout */
  .ant-layout-header {
    display: flex;
    position: fixed;
    z-index: 10;
    width: 100%;
    height: 64px;
    line-height: 64px;
    padding: 0 50px;
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
  }

  .ant-layout-footer {
    text-align: center;
  }

  /* tabs */
  .ant-tabs-card.ant-tabs-top {
    > .ant-tabs-nav .ant-tabs-tab {
      border-radius: 18px;
      background-color: transparent;
      border-color: transparent !important;
    }
    > .ant-tabs-nav .ant-tabs-tab-active {
      border-bottom-color: ${ANTD_COLOR.borderColor};
      background-color: ${COLOR.GREY_1};
      .ant-tabs-tab-btn {
        color: ${COLOR.BLACK};
      }
    }
  }

  .ant-tabs-top > .ant-tabs-nav::before,
  .ant-tabs-bottom > .ant-tabs-nav::before,
  .ant-tabs-top > div > .ant-tabs-nav::before,
  .ant-tabs-bottom > div > .ant-tabs-nav::before {
    border-bottom: none;
  }

  /* table */
  .ant-table {
    .ant-table-thead {
      > tr > th {
        padding: 12px 16px;
        color: #4d596a; // TODO: move to theme
        background-color: #f2f4f9; // TODO: move to theme
        &:not(:last-child):not(.ant-table-selection-column):not(
            .ant-table-row-expand-icon-cell
          ):not([colspan])::before {
          background-color: transparent;
        }
      }
    }
    .ant-table-tbody > tr {
      &:last-child {
        td {
          &:first-child {
            border-bottom-left-radius: 5px;
          }
          &:last-child {
            border-bottom-right-radius: 5px;
          }
        }
      }
    }
  }

  .ant-table:not(.ant-table-bordered) {
    .ant-table-cell:first-child {
      border-left: 1px solid ${COLOR.BORDER_GREY};
    }
    .ant-table-cell:last-child {
      border-right: 1px solid ${COLOR.BORDER_GREY};
    }
    .ant-table-thead {
      > tr > th {
        border-top: 1px solid ${COLOR.BORDER_GREY};
        border-bottom: 1px solid ${COLOR.BORDER_GREY};
      }
    }
  }

  .ant-tooltip-content .ant-tooltip-inner {
    padding: 12px;
  }

  /* alert */
  .inherit-alert-info {
    background-color: inherit;
    border-color: ${COLOR.PRIMARY};
  }

  /* ant image */
  .ant-image-preview-wrap {
    background: ${COLOR.GREY_2};
  }

  /* ant notification */
  .ant-notification-notice-message {
    margin-bottom: 0 !important;
  }

  .next-error-h1 {
    color: ${COLOR.BLACK};
    border-color: ${COLOR.BLACK} !important;
    + div {
      color: ${COLOR.BLACK};
    }
  }

  ${MEDIA_QUERY.mobileL} {
    .ant-table {
      .ant-table-thead {
        > tr > th {
          padding: 6px 16px;
        }
      }
      .ant-table-tbody > tr {
        > td {
          padding: 6px 16px;
        }
      }
    }
  }

  ${MEDIA_QUERY.mobileM} {
    .ant-layout-header {
      padding: 0;
    }
  }
`;
