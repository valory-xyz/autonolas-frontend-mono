import { createGlobalStyle } from 'styled-components';

import { ANTD_COLOR, COLOR, MEDIA_QUERY } from './ui-theme';

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
    margin-bottom: 0px !important;
  }
  .mb-4 {
    margin-bottom: 4px !important;
  }
  .mb-8 {
    margin-bottom: 8px !important;
  }
  .mb-12 {
    margin-bottom: 12px !important;
  }
  .mb-16 {
    margin-bottom: 16px !important;
  }
  .mb-20 {
    margin-bottom: 20px !important;
  }
  .mb-24 {
    margin-bottom: 24px !important;
  }
  .mb-48 {
    margin-bottom: 48px !important;
  }
  .mt-0 {
    margin-top: 0px !important;
  }
  .mt-4 {
    margin-top: 4px !important;
  }
  .mt-8 {
    margin-top: 8px !important;
  }
  .mt-12 {
    margin-top: 12px !important;
  }
  .mt-16 {
    margin-top: 16px !important;
  }
  .mt-20 {
    margin-top: 20px !important;
  }
  .mt-24 {
    margin-top: 24px !important;
  }
  .mt-48 {
    margin-top: 48px !important;
  }
  .mr-8 {
    margin-right: 8px !important;
  }
  .mr-16 {
    margin-right: 16px !important;
  }
  .mr-24 {
    margin-right: 24px !important;
  }
  .ml-4 {
    margin-left: 4px !important;
  }
  .ml-8 {
    margin-left: 8px !important;
  }
  .p-0 {
    padding: 0 !important;
  }
  .p-12 {
    padding: 12px !important;
  }
  .px-12 {
    padding: 0 12px !important;
  }
  .p-24 {
    padding: 24px !important;
  }
  .p-16 {
    padding: 16px !important;
  }
  .pl-0 {
    padding-left: 0px !important;
  }
  .pt-24 {
    padding-top: 24px !important;
  }
  .pt-48 {
    padding-top: 48px !important;
  }

  .ml-auto {
    margin-left: auto !important;
  }
  .mr-auto {
    margin-right: auto !important;
  }
  .my-4 {
    margin: 4px 0 !important;
  }
  .my-8 {
    margin: 8px 0 !important;
  }
  .mr-12 {
    margin-right: 12px !important;
  }
  .mb-2 {
    margin-bottom: 2px !important;
  }
  .mb-32 {
    margin-bottom: 32px !important;
  }
  .w-100 {
    width: 100%;
  }
  .font-weight-400 {
    font-weight: 400 !important;
  }
  .font-weight-600 {
    font-weight: 600 !important;
  }



  .block {
    display: block;
  }

  .font-weight-600 {
    font-weight: 600 !important;
  }

  .text-start {
    text-align: start;
  }
  .text-center {
    text-align: center;
  }
  .text-end {
    text-align: end !important;
  }

  .full-width {
    width: 100%;
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

  /* navbar dropdown */
  .ant-dropdown-menu {
    width: 180px;
  }
  .ant-dropdown-menu-item-disabled {
    color: ${COLOR.PRIMARY} !important;
    cursor: default !important;
    &:hover {
      background-color: #f7e6ff !important;
    }
  }

  .nav-button {
    padding: 3px;
    margin-top: auto;
    margin-bottom: auto;
    width: 32px;
    height: 32px;
  }
  
  .header-left-content {
    display: flex;
    flex-direction: row;
    margin-right: 32px;
  }

  /* table */
  .ant-table {
    .ant-table-thead {
      > tr > th {
        padding: 12px 16px;
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
      border-left: 1px solid ${COLOR.BORDER_GREY_2};
    }
    .ant-table-cell:last-child {
      border-right: 1px solid ${COLOR.BORDER_GREY_2};
    }
    .ant-table-thead {
      > tr > th {
        border-top: 1px solid ${COLOR.BORDER_GREY_2};
        border-bottom: 1px solid ${COLOR.BORDER_GREY_2};
      }
    }
  }

  .ant-tooltip-content .ant-tooltip-inner {
    padding: 12px;
  }

  /* alert */
  .ant-alert {
    align-items: flex-start;
    &-info {
      color: #003EB3;
    }
    &-warning {
      color: #612500;
    }
    &-error {
      color: #A8071A;
    }
    .ant-typography {
      color: inherit;
    }
    .anticon {
      margin-top: 5px;
    }
  }

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
