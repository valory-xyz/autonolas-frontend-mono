import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

export const EmptyMessage = styled.div`
  min-height: 55vh;
  width: ${({ width }) => width || 'auto'};
  display: flex;
  align-items: center;
  margin: 0 auto;
  text-align: center;
  flex-direction: column;
  justify-content: center;
  .empty-message-logo {
    width: 96px;
    height: 96px;
    margin-bottom: 2rem;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url(/images/agent.png);
  }
  p {
    margin: 0;
  }
  .ant-btn-link {
    padding: 0;
  }
`;

export const FormContainer = styled.div`
  max-width: 520px;
  textarea {
    resize: none;
  }
  .ant-typography {
    color: ${COLOR.PRIMARY};
  }
  h2 {
    margin-top: 0rem;
  }
`;

export const RegisterFooter = styled.div`
  display: flex;
  align-items: center;
  p {
    margin: 0;
    margin-right: 24px;
  }
`;

export const PageMainContainer = styled.div`
  padding: 24px;
  border-radius: 16px;
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.03),
    0 1px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px 0 rgba(0, 0, 0, 0.02);
  background-color: ${COLOR.WHITE};

  h2.ant-typography {
    margin: 0;
  }

  .ant-tabs-nav {
    margin: 24px 0;
  }

  .ant-table {
    .ant-table-thead > tr > th {
      font-weight: 500;
    }

    .ant-table-cell button.ant-btn-link {
      padding: 0;
    }
  }
`;
