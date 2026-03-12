import styled from 'styled-components';

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
