import styled from 'styled-components';
import { Layout, Statistic } from 'antd';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

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

  /* table */
  .ant-table {
    .ant-table-tbody > tr {
      > td {
        padding: 8px 16px;
        .ant-btn {
          &:first-child {
            padding-left: 0;
          }
        }
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

export const SelectContainer = styled.div``;

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

export const RewardsStatistic = styled(Statistic)`  
  .ant-statistic-title {
    color: var(--Colors-Neutral-Text-colorTextSecondary, #4D596A);
    /* Base/Normal */
    font-size: 14px;
    line-height: 20px; /* 142.857% */
  }
  .ant-statistic-content {
    color: var(--Colors-Neutral-Text-colorText, #1F2229);
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 32px; /* 133.333% */
    letter-spacing: -0.72px;
  }
`
