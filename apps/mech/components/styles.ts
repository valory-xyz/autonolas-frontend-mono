import styled from 'styled-components';

import { COLOR } from '@autonolas/frontend-library';

export const EmptyMessage = styled.div`
  min-height: 55vh;
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
    background-image: url('/images/agent.png');
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
`;
