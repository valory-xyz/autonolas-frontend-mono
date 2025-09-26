import styled from 'styled-components';
import { Card, Flex, Layout } from 'antd';
import { COLOR, MEDIA_QUERY } from '@autonolas-frontend-mono/ui-theme';

export const CONTENT_MAX_WIDTH = 720;

export const CustomLayout = styled(Layout)`
  margin-bottom: 8rem;
  min-height: 100vh;
  background-color: ${COLOR.WHITE};

  .site-layout {
    padding: 60px 0 0 0;
  }

  .logo-link {
    display: flex;
  }

  .ant-layout-header {
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 1;
    width: 100%;
    height: 64px;
    line-height: 64px;
    padding: 0 2rem;
    gap: 0 16px;
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
    ${MEDIA_QUERY.mobileM} {
      &.ant-menu-horizontal {
        line-height: 2;
      }
    }
  }

  ${MEDIA_QUERY.tablet} {
    .ant-layout-header {
      position: relative;
      flex-direction: column;
      height: auto;
      padding: 0;
    }
    .site-layout {
      margin-top: 0;
    }
    .ant-menu.ant-menu-horizontal {
      justify-content: center;
      width: 100%;
    }
  }
  ${MEDIA_QUERY.mobileL} {
    .site-layout {
      padding: 0 1rem;
    }
    .footer-center {
      display: none;
    }
  }
  ${MEDIA_QUERY.mobileM} {
    .ant-layout-header {
      .ant-menu-overflow-item {
        line-height: 2;
      }
    }
  }
`;

export const SubFooter = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0.5rem;
  padding: 2rem 1rem;
  border: 1px solid ${COLOR.GREY_1};
  border-radius: 0px 0px 20px 20px;
  border-top-color: transparent;

  ${MEDIA_QUERY.tablet} {
    position: relative;
    flex-direction: column;
    font-size: 16px;
    padding: 2rem 0.75rem 1.5rem 0.75rem;
  }
`;

export const ContractsInfoContainer = styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  .mech-contract {
    display: flex;
    align-items: center;
  }
  img {
    margin-right: 8px;
  }
`;

export const FooterContainer = styled.div`
  margin-bottom: 8rem;
`;

export const ContentContainer = styled(Flex)`
  flex-direction: column;
  margin: 0 auto;
  gap: 120px;
`;

export const ContentWrapper = styled.div`
  width: ${CONTENT_MAX_WIDTH}px;
  margin: auto;
`;

export const DocsCard = styled(Card)`
  height: auto;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;

  &.what-is-olas-card {
    width: 230px;
  }

  &.the-docs-card {
    border: 1px solid #fff;
    background: linear-gradient(
      180deg,
      var(--Colors-Neutral-colorWhite, rgba(255, 255, 255, 0.5)) 0%,
      var(--Colors-Base-Neutral-1, rgba(242, 244, 249, 0.5)) 100%
    );
    box-shadow: 8px 8px 24px 0 rgba(24, 39, 75, 0.12);

    &:hover {
      background: ${COLOR.WHITE};
    }
  }

  .ant-card-body {
    padding: 24px 16px;
  }

  &:hover {
    background: ${COLOR.BASE.NEUTRAL_1};
  }
`;

export const GetInvolvedCard = styled(Card)`
  min-height: 278px;
  height: 100%;
  border: 1px solid white;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(242, 244, 249, 0.5) 100%);
  box-shadow: 0px 8px 24px 0px rgba(24, 39, 75, 0.12);
  backdrop-filter: blur(1px);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;

  body {
    height: 100%;
    padding: 24px;
  }

  &:hover {
    background: ${COLOR.WHITE};
    box-shadow: 0px 8px 24px 0px rgba(24, 39, 75, 0.15);
  }
`;

export const GetInvolvedBg = styled.div`
  background-image: url('/metric-bg.png'), linear-gradient(#f4f7fb, #f4f7fb);
  background-size:
    45px 45px,
    auto;
  background-repeat: repeat, no-repeat;
  background-position:
    center,
    0 0;
  background-blend-mode: multiply, normal;
  padding: 80px 0;
  position: relative;
  border-bottom: 1px solid ${COLOR.BORDER_GREY_2};
  border-top: 1px solid ${COLOR.BORDER_GREY_2};
`;

export const BackgroundOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  opacity: 0.5;
  z-index: 0;
`;

export const Hero = styled.div`
  display: flex;
  flex-direction: column;
  max-width: auto;
  height: 464px;
  margin: 80px auto;
  background: linear-gradient(180deg, ${COLOR.WHITE} 0%, #e9eff7 100%);
`;
