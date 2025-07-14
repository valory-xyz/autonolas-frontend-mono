import { Card } from 'antd';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

export const Container = styled(Card)``;

export const WrapperDiv = styled.div`
  width: 100%;
  margin: 1rem 0;
  padding: 0.5rem 0;
  border: 1px solid ${COLOR.PRIMARY};
  border-radius: 4px;
  overflow: auto;
  cursor: pointer;
  .text {
    padding: 0 1rem;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .documentation-chapters {
    transition: 0.2s;
  }
`;

export const DocSection = styled.div`
  display: flex;
  align-items: flex-start;
  .navigation-section {
    position: sticky;
    top: 64px;
    width: 25%;
    max-width: 380px;
  }
  .reading-section {
    max-width: 1000px;
    padding: 0 8rem;
    h3 {
      font-weight: bold;
    }
    .green-text-2 {
      font-size: 19px;
      color: ${COLOR.PRIMARY};
      font-family: 'minecraft', sans-serif;
    }
  }
  .ant-anchor {
    padding-left: 4px;
    &:before {
      display: none !important;
    }
    .ant-anchor-ink {
      display: none !important;
    }
    .ant-anchor-link {
      padding-left: 0px;
      .ant-anchor-link-title {
        color: inherit;
        text-decoration: none;
      }
      &.bold .ant-anchor-link-title {
        color: ${COLOR.BLACK};
        font-size: 15px;
      }
    }
  }

  /* custom nav-anchor */
  .custom-nav-anchor {
    font-size: 18px;
    padding: 0 40px 0 0;
    padding-left: ${({ isMobile }) => (isMobile ? '16px' : '0')};
    a.ant-anchor-link-title {
      font-size: 18px;
      text-decoration: none;
    }
    &:last-child {
      border-bottom-color: transparent;
    }
  }
  .custom-nav-anchor-active a.ant-anchor-link-title {
    color: ${COLOR.PRIMARY} !important;
    font-weight: 600;
    text-underline-offset: 4px !important;
  }

  ${MEDIA_QUERY.tabletL} {
    .reading-section {
      padding: 0 2rem;
    }
  }

  ${MEDIA_QUERY.tablet} {
    flex-direction: column;
    .navigation-section {
      position: relative;
      top: 0;
      width: 100%;
      max-width: 100%;
    }
    .reading-section {
      margin-top: 2rem;
      padding: 0;
    }
  }
`;

export const Footnote = styled.div`
  font-size: 12px;
  font-style: italic;
`;
