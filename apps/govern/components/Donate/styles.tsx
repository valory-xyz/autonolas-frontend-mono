import styled from 'styled-components';

import { MEDIA_QUERY } from 'libs/ui-theme/src';

export const DonateContainer = styled.div`
  display: flex;
  gap: 16px;

  .donate-section {
    width: 720px;
  }
  .last-epoch-section {
    flex: auto;
  }

  ${MEDIA_QUERY.tabletL} {
    flex-direction: column;
    .donate-section {
      width: 100%;
    }
    .last-epoch-section {
      padding-left: 0;
      margin-left: 0;
      border-left: none;
    }
  }
`;

export const EpochStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  h5,
  div {
    margin: 0;
  }
`;

export const EpochCheckpointRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 1rem;
  .ant-btn {
    width: 200px;
  }
`;
