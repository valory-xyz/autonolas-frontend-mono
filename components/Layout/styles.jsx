import { Layout } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

export const CustomLayout = styled(Layout)`
  margin-bottom: 8rem;
  .site-layout {
    padding: 0 50px;
    margin-top: 64px;
  }
  .site-layout-background {
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

  ${MEDIA_QUERY.tabletL} {
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

export const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px;
  background-color: ${COLOR.WHITE};
  line-height: normal;

  ${MEDIA_QUERY.tablet} {
    margin-bottom: 0;
    .column-1 {
      line-height: normal;
    }
  }

  /* nav-bar for pages except landing-page */
  ${MEDIA_QUERY.mobileL} {
    margin-bottom: 0;
  }

  ${MEDIA_QUERY.mobileM} {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

export const OlasHeader = styled(Layout.Header)`
  padding: 0 40px;
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  display: flex;
  align-items: center;
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

export const ContractsInfoContainer = styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  .registry-contract {
    display: flex;
    align-items: center;
  }
  img {
    margin-right: 8px;
  }
`;
