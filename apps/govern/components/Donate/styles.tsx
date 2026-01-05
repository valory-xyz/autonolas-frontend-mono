import styled from 'styled-components';

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
