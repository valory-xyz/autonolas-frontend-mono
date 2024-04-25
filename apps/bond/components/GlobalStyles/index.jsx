import { createGlobalStyle } from 'styled-components';
import { MEDIA_QUERY, COLOR } from '@autonolas/frontend-library';

const ANTD_COLOR = {
  borderColor: '#f0f0f0',
};

// const GlobalStyles = styled.div`
const GlobalStyle = createGlobalStyle`
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
  .mb-24 {
    margin-bottom: 24px !important;
  }
  .mb-128 {
    margin-bottom: 128px !important;
  }
  .mt-0 {
    margin-top: 0px;
  }
  .mt-8 {
    margin-top: 8px;
  }
  .mt-12 {
    margin-top: 12px;
  }
  .mt-48 {
    margin-top: 48px !important;
  }
  .mr-12 {
    margin-right: 12px;
  }
  .mx-auto {
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .pl-0 {
    padding-left: 0px !important;
  }
  .p-0 {
    padding: 0px !important;
  }
  .p-8 {
    padding: 8px !important;
  }
  .p-16 {
    padding: 16px !important;
  }
  .ant-alert {
    border-radius: 5px;
  }
  .show-only-sm {
    display: none;
  }
  .hide-only-sm {
    display: initial;
  }

  .text-center {
    text-align: center !important;
  }

  /* layout */
  .ant-layout-header {
    display: flex;
    align-items: center;
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


  /* tabs */
  .ant-tabs-card.ant-tabs-top {
    > .ant-tabs-nav .ant-tabs-tab {
      padding: 10px 16px;
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

  ${MEDIA_QUERY.mobileL} {
    .show-only-sm {
      display: initial;
    }
    .hide-only-sm {
      display: none;
    }
  }

  background-size: 100%;
  background-color: ${COLOR.WHITE};

  .ant-layout-footer {
    text-align: center;
  }
  .ant-result-title {
    color: ${COLOR.BLACK};
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
        font-weight: normal;
        padding: 12px 16px;
        &:not(:last-child):not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell):not([colspan])::before {
          background-color: transparent;
        }
      }
    }
    .ant-table-tbody > tr {
      > td {
        padding: 12px 16px;
        &.underline span {
          text-decoration: underline;
        }
        .ant-btn {
          &:first-child {
            padding-left: 0;
          }
        }
      }
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


  /* form */
  .ant-form-item-label > label {
    font-weight: bold;
  }
  .custom-form-item-lock {
    margin-bottom: 4px;
  }

  /* button */
  .ant-btn-danger {
    text-shadow: none;
  }

  ${MEDIA_QUERY.tablet} {
    .ant-layout-header {
      position: relative;
      flex-direction: column;
      height: auto;
      padding: 0;
    }
  }

  ${MEDIA_QUERY.mobileM} {
    .ant-layout-header {
      padding: 0;
    }
  }
`;

export default GlobalStyle;
