import { Layout } from 'antd';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from 'libs/ui-theme/src';

export const CustomLayout = styled(Layout)`
  min-height: 100vh;
  background-color: ${(props) => (props.$showWhiteBg ? COLOR.WHITE : COLOR.BASE.NEUTRAL_1)};

  .site-layout {
    padding: 0 48px;
    margin-top: 64px;
  }
  .site-layout-background {
    padding: 24px 0;
    min-height: calc(100vh - 140px);
  }
  .registry-tabs {
    .ant-tabs-extra-content {
      &:not(:last-child) {
        .ant-typography {
          color: ${COLOR.PRIMARY};
          margin: 0 12px 0 0;
        }
      }
      &:last-child {
        gap: 12px;
        display: flex;
      }
    }

    .ant-tabs-nav-list {
      border-radius: 8px;
      padding: 2px;
      background-color: ${COLOR.BASE.NEUTRAL_1};
      display: flex;
      align-items: center;

      .ant-tabs-tab {
        color: ${COLOR.TEXT_SECONDARY};
        padding: 6px 16px;
        border: none;
        border-radius: 6px;
      }

      .ant-tabs-tab-active {
        color: ${COLOR.NEUTRAL_10};
        background-color: ${COLOR.WHITE} !important;
        box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.02);
      }
    }
  }

  .ant-menu-overflow {
    height: 40px;
    display: flex;
    align-items: center;
  }

  .ant-menu-item {
    height: 40px;
    display: flex;
    align-items: center;

    &.ant-menu-item-selected {
      background-color: ${COLOR.PRIMARY_BG};
      border-radius: 8px;
      font-weight: 500;
    }

    .ant-menu-title-content {
    }
  }

  .ant-input-affix-wrapper {
    height: 40px;
  }

  /* table */
  .ant-table {
    .ant-table-tbody > tr {
      > td {
        padding: 8px 16px;
        .td-center {
          align: center;
        }
        .ant-btn-link {
          font-size: 16px;
        }
      }
    }
  }

  .wallet-adapter-dropdown {
    margin-left: 24px;
  }

  ${MEDIA_QUERY.tabletL} {
    .site-layout {
      padding: 0 24px;
    }
    .site-layout-background {
      padding: 0;
    }
    .registry-tabs {
      .ant-tabs-nav {
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        .ant-tabs-extra-content {
          margin-top: 12px;
        }
      }
      .ant-tabs-nav-wrap {
        padding-left: 0;
      }
      .ant-tabs-nav-list {
        transform: none !important;
      }
    }
    /* footer from autonolas-library */
    main + div {
      padding: 24px;
    }
  }

  ${MEDIA_QUERY.mobileL} {
    .site-layout {
      padding: 0 16px;
    }
    /* footer from autonolas-library */
    main + div {
      flex-direction: column;
      align-items: center;
      gap: 20px;
      .footer-center {
        position: relative;
        left: 0;
        transform: none;
      }
    }
  }
`;

export const Logo = styled.div`
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-right: ${(props) => (props.ismobile === 'true' ? '10px' : '20px')};
  > span {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }

  ${MEDIA_QUERY.mobileL} {
    margin-right: 0.5rem;
  }
`;

export const SelectContainer = styled.div`
  .ant-select {
    display: flex;
    align-items: center;

    .ant-select-selector {
      padding: 4px 12px;
      height: auto;
    }
  }
`;

export const RightMenu = styled.div`
  display: flex;
  align-items: center;
`;

export const ContractsInfoContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  .registry-contract {
    display: flex;
    align-items: center;
  }
  img {
    margin-right: 8px;
  }

  ${MEDIA_QUERY.laptop} {
    flex-direction: column;
    align-items: flex-start;
  }
  ${MEDIA_QUERY.mobileL} {
    align-items: center;
  }
`;

export const OlasHeader = styled(Layout.Header)`
  padding: 0 ${(props) => (props.ismobile === 'true' ? '10px' : '20px')} !important;
  border-bottom: 1px solid ${COLOR.BORDER_GREY} !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
`;
