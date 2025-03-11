import styled from 'styled-components';

export const FormContainer = styled.div`
  .custom-vertical-form {
    display: flex;
    align-items: flex-start;
    > .ant-form-item:last-child {
      margin-top: 36px;
      margin-left: 12px;
    }
  }
  .full-width {
    width: 100%;
  }
`;
