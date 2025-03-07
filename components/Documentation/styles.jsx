import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

export const Container = styled.div``;

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
    top: 74px;
    width: 25%;
    max-width: 380px;
    .ant-anchor {
      .ant-anchor-link {
        padding-block: 8px;
      }
      .ant-anchor-link-title {
        white-space: initial;
        text-overflow: initial;
      }
    }
  }
  .reading-section {
    max-width: 1000px;
    padding: 0 6rem 0 4rem;
    line-height: 1.5;
    h3 {
      font-weight: bold;
    }
    .green-text-2 {
      font-size: 19px;
      color: ${COLOR.PRIMARY};
      font-family: 'minecraft', sans-serif;
    }
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
