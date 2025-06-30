import styled from 'styled-components';

import { COLOR } from '@autonolas/frontend-library';

export const ComplexLabel = styled.div`
  display: flex;
  flex-direction: column;

  .label-helper-text {
    color: ${COLOR.GREY_2};
    a {
      display: inline-flex;
      align-items: center;
      text-decoration: underline;
      text-underline-position: under;
      svg {
        margin-left: 2px;
      }
    }
  }
`;

export const YourHashContainer = styled.div`
  p {
    margin: 0 0 0.5rem 0;
  }
`;
