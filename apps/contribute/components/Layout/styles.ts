import { Alert, Layout, Menu } from 'antd';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from 'libs/ui-theme/src';

import { MENU_WIDTH } from 'util/constants';

export const CustomLayout = styled(Layout)<{ $isBannerVisible: boolean; $isPadded: boolean }>`
  background: #f2f4f9;

  --header-height: 64px;
  --banner-height: 56px;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 0;
  }

  .border-bottom {
    border-bottom: 1px solid ${COLOR.BORDER_GREY};
  }
  .border-right {
    border-left: 1px solid ${COLOR.BORDER_GREY};
  }

  .show-only-sm {
    display: none;
  }
  .hide-only-sm {
    display: initial;
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

  //Switch
  .ant-switch {
    margin-right: 4px;
  }

  .ant-notification {
    .ant-notification-notice-message {
      margin-bottom: 0 !important;
    }
  }

  ${MEDIA_QUERY.mobileL} {
    --header-height: 100px;
  }

  /* filter: invert(0.95) hue-rotate(39deg); // uncomment this line for dark mode */
  .site-layout {
    padding: ${({ $isPadded }) => ($isPadded === true ? '0' : ' 0 20px 40px 20px;')};
    margin-top: ${({ $isBannerVisible }) =>
      $isBannerVisible === true
        ? 'calc(var(--header-height) + var(--banner-height))'
        : 'var(--header-height)'};
    .contribute-footer {
      > div {
        height: 100px;
        align-items: center;
        padding-left: 0;
        padding-right: 0;
      }
    }
    .site-layout-background {
      padding: ${({ $isPadded }) => ($isPadded === true ? '0' : '24px 0;')};
      min-height: calc(100vh - 164px);
    }
  }

  .ant-list-item.bot-chat {
    text-align: right;
    background-color: ${COLOR.GREY_3};
    border-bottom: 1px solid ${COLOR.GREY_1};
    .ant-list-item-meta-content {
      padding: 0 1rem;
    }
  }

  ${MEDIA_QUERY.mobileL} {
    .show-only-sm {
      display: initial;
    }
    .hide-only-sm {
      display: none;
    }
  }

  ${MEDIA_QUERY.mobileM} {
    .site-layout {
      padding: 0 20px;

      .contribute-footer {
        > div {
          height: 164px;
        }
      }
    }
    .site-layout-background {
      padding: 8px 0;
    }
  }
`;

export const Logo = styled.div`
  width: 175px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-right: 1rem;
  span {
    margin-left: 0.5rem;
  }
`;

export const RightMenu = styled.div`
  display: flex;
  align-items: center;

  ${MEDIA_QUERY.tablet} {
    line-height: normal;
  }
`;

export const SupportOnlyDesktop = styled.div`
  margin: 4rem 0;
`;

export const NextUpdateTimer = styled.div`
  display: inline-flex;
  align-items: center;
  .ant-statistic {
    color: inherit;
  }
  .ant-statistic-content {
    font-weight: inherit;
    font-size: inherit;
    color: inherit;
  }
`;

export const Banner = styled(Alert)`
  &.ant-alert {
    min-height: var(--banner-height);
    z-index: 10;
    border-radius: 0;
    border: 0;
    align-items: center;
    text-align: center;
  }
`;

export const CustomHeader = styled(Layout.Header)<{ $isBannerVisible: boolean }>`
  &.ant-layout-header {
    display: flex;
    flex-direction: column;
    padding: 0;
    max-height: ${({ $isBannerVisible }) =>
      $isBannerVisible === true
        ? 'calc(var(--header-height) + var(--banner-height))'
        : 'var(--header-height)'};
  }
`;

export const CustomHeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: ${COLOR.WHITE};
  height: var(--header-height);
  border-bottom: 1px solid ${COLOR.BORDER_GREY};

  ${MEDIA_QUERY.mobileL} {
    flex-direction: column;
    height: auto;
    gap: 8px;
  }
`;

export const CustomMenu = styled(Menu)<{ $isBannerVisible: boolean }>`
  position: fixed;
  top: ${({ $isBannerVisible }) =>
    $isBannerVisible === true
      ? 'calc(var(--header-height) + var(--banner-height))'
      : 'var(--header-height)'};
  bottom: 0;
  left: 0;
  width: ${MENU_WIDTH}px;
  padding: 16px;
  border-right: 1px solid ${COLOR.BORDER_GREY} !important;
  z-index: 2;
  li {
    line-height: 40px;
    height: 40px;
    &:not(.ant-menu-item-selected) svg {
      color: #606f85;
    }
  }
`;
