import styled from 'styled-components';
import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

export const DonateContainer = styled.div`
  display: flex;
  .donate-section {
    width: 720px;
  }
  .last-epoch-section {
    padding-left: 1rem;
    margin-left: 1rem;
    border-left: 1px solid ${COLOR.BORDER_GREY};
  }

  ${MEDIA_QUERY.mobileL} {
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
