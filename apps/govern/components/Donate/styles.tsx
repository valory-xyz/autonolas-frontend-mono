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

export const StakingIncentivesModalContainer = styled.div<{ $isEmpty?: boolean }>`
  display: grid;
  grid-template-columns: 200px calc(100% - 200px);
  gap: 16px;
  margin: 32px 0 16px;

  ${({ $isEmpty }) =>
    $isEmpty &&
    `
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 220px;
  `}

  .ant-steps {
    height: fit-content;

    .ant-steps-item-description {
      font-size: 14px;
    }
  }

  .ant-table {
    scrollbar-color: unset;
  }

  .ant-table-thead .ant-table-cell {
    background-color: transparent !important;
  }
`;
