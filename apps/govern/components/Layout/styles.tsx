import { Layout } from 'antd';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

import styled from 'styled-components';

export const CustomLayout = styled(Layout)`
  background-color: #f2f4f9;
  min-height: 100vh;

  .site-layout {
    padding: 0 40px;
    margin-top: 64px;
  }
  .site-layout-background {
    padding: 40px 0;
    min-height: calc(100vh - 140px);
  }

  ${MEDIA_QUERY.tabletL} {
    .site-layout {
      padding: 0 24px;
    }
    .site-layout-background {
      padding: 0;
    }
    /* footer from autonolas-library */
    main + div {
      background-color: #f2f4f9;
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
  margin-right: 1rem;
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
  margin-left: auto;
`;

export const OlasHeader = styled(Layout.Header)`
  padding: 0 40px;
  border-bottom: 1px solid ${COLOR.BORDER_GREY};
  display: flex;
  align-items: center;

  ${MEDIA_QUERY.mobileL} {
    padding: 0 0.5rem !important;
  }
`;
