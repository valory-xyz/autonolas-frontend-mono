import styled, { createGlobalStyle } from 'styled-components';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

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
  }

  h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
  }

  /* common */
  .p-0 {
    padding: 0 !important;
  }
  .p-12 {
    padding: 12px !important;
  }
  .px-12 {
    padding: 0 12px !important;
  }
  .px-24 {
    padding: 0 24px !important;
  }
  .py-12 {
    padding: 12px 0 !important;
  }
  .py-24 {
    padding: 24px 0 !important;
  }
  .p-24 {
    padding: 24px !important;
  }
  .pb-12 {
    padding-bottom: 12px !important;
  }
  .pl-24 {
    padding-left: 24px;
  }
  .my-4 {
    margin: 4px 0 !important;
  }
  .my-8 {
    margin: 8px 0 !important;
  }
  .mr-4 {
    margin-right: 4px;
  }
  .mr-8 {
    margin-right: 8px !important;
  }
  .mr-12 {
    margin-right: 12px !important;
  }
  .mr-24 {
    margin-right: 24px;
  }
  .mr-48 {
    margin-right: 48px !important;
  }
  .mb-0 {
    margin-bottom: 0px !important;
  }
  .m-0 {
    margin: 0 !important;
  }
  .m-24 {
    margin: 24px !important;
  }
  .mb-2 {
    margin-bottom: 2px !important;
  }
  .mb-4 {
    margin-bottom: 4px !important;
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
  .mb-32 {
    margin-bottom: 32px !important;
  }
  .mb-48 {
    margin-bottom: 48px !important;
  }
  .mt-0 {
    margin-top: 0px !important;
  }
  .mt-8 {
    margin-top: 8px;
  }
  .mt-12 {
    margin-top: 12px;
  }
  .mt-24 {
    margin-top: 24px;
  }
  .mt-48 {
    margin-top: 48px !important;
  }
  .ml-4 {
    margin-left: 4px !important;
  }
  .ml-8 {
    margin-left: 8px;
  }
  .ml-12 {
    margin-left: 12px;
  }
  .w-100 {
    width: 100%;
  }
  .block {
    display: block;
  }
  .text-center {
    text-align: center !important;
  }
  .text-right {
    float: right;
  }
  .text-small {
    font-size: 14px;
  }
  .bg-shaded {
    background-color: ${COLOR.GREY_3};
  }
  .border-bottom {
    border-bottom: 1px solid ${COLOR.BORDER_GREY};
  }
  .border-top {
    border-top: 1px solid ${COLOR.BORDER_GREY};
  }
  .border-left {
    border-left: 1px solid ${COLOR.BORDER_GREY};
  }
  .border-right {
    border-left: 1px solid ${COLOR.BORDER_GREY};
  }
  .font-weight-400 {
    font-weight: 400 !important;
  }
  .font-weight-600 {
    font-weight: 600 !important;
  }
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
  .show-only-sm {
    display: none;
  }
  .hide-only-sm {
    display: initial;
  }

  /* layout */
  .ant-layout-header {
    height: 64px;
    padding: 0 20px;
    display: flex;
    position: fixed;
    z-index: 10;
    width: 100%;
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

  /* title */
  .custom-text-secondary {
    display: inline-block;
    max-width: 400px;
    margin-bottom: 12px;
    svg {
      color: ${COLOR.BORDER_GREY};
    }
  }

  h2.ant-typography {
    margin-bottom: 8px;
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

  /* hyperlinks */
  a.ant-typography,
  .ant-typography a {
    color: ${COLOR.PRIMARY};
    text-decoration: none;
    &:hover,
    &:active {
      text-decoration: none;
      color: #b972e8;
    }
  }

  .underline {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: ${COLOR.PRIMARY};
  }

  .disabled-link {
    pointer-events: none;
    color: #ccc !important;
    text-decoration: line-through;
  }

  #conversations-list {
    height: 55vh;
    overflow: auto;
    border: 1px solid ${COLOR.BORDER_GREY};
    border-radius: 4px;
    padding: 1rem;
  }

  .innovataurs-card {
    padding: 0;
  }

  .innovataurs-card-content {
    display: flex;
    align-items: center;
  }

  .innovataurs-card-image {
    width: 250px;
  }

  .innovataurs-card-text-container {
    margin-left: 2rem;
  }

  .innovataurs-card-title {
    margin-bottom: 8px;
  }

  .innovataurs-card-text {
    margin-bottom: 8px;
    max-width: 65ch;
  }

  .my-message {
    float: right;
    text-align: right;
  }

  .clear {
    clear: both;
  }
  // Actions Card
  .actions-card-body {
    max-height: 200px;
    overflow-y: auto;
    padding-top: 4px;
  }

  // Memory Card
  .memory-list-item {
    padding: 20px;
  }

  .memory-list-item-content {
    margin-bottom: 0;
  }

  // Plugins Card
  .plugins-card-list-item {
    padding: 20px;
  }

  // Chatbot Card
  .chatbot-card {
    max-width: 800px;
  }

  .chatbot-body-container {
    height: 80vh;
    width: 100%;
  }

  // Member Chat Card
  .member-chat-card {
    max-width: 800px;
  }

  .member-chat-body-container {
    width: 100%;
  }


  /* antd steps */
  .ant-steps-item-title {
    width: 100%;
  }

  //Switch
  .ant-switch {
    // add right padding assuming a label is added to the right
    margin-right: 4px;
  }

  .ant-notification {
    .ant-notification-notice-message {
      margin-bottom: 0 !important;
    }
  }

  /* antd table */
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
      border-left: 1px solid #dfe5ee;
    }
    .ant-table-cell:last-child {
      border-right: 1px solid #dfe5ee;
    }
    .ant-table-thead {
      > tr > th {
        font-weight: 500;
        border-top: 1px solid #dfe5ee;
        border-bottom: 1px solid #dfe5ee;
      }
    }
  }
`;

export default GlobalStyle;

export const Ellipsis = styled.span`
  max-width: 100px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${MEDIA_QUERY.tablet} {
    max-width: 200px;
  }
`;
