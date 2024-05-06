import { Layout } from 'antd';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

import styled from 'styled-components';

export const CustomLayout = styled(Layout)`
  .site-layout {
    padding: 0 50px;
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
    .ant-tabs-nav-wrap {
      padding-left: 16px;
    }
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

export const Logo = styled.div<{isMobile: boolean | undefined}>`
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-right: ${(props) => (props.isMobile === true ? '10px' : '20px')};
  > span {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }

  ${MEDIA_QUERY.mobileL} {
    margin-right: 0.5rem;
  }
`;

export const RightMenu = styled.div`
  display: flex;
  align-items: center;
`;

export const OlasHeader = styled(Layout.Header)<{isMobile: boolean | undefined}>`
  padding: 0 ${(props) => (props.isMobile === true ? '10px' : '20px')} !important;
  border-bottom: 1px solid ${COLOR.BORDER_GREY} !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
`;
