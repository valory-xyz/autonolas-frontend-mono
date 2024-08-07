import { Typography } from 'antd';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from 'libs/ui-theme/src';

const { Text } = Typography;

export const ServiceStateContainer = styled.div`
  margin-top: 1rem;
  .ant-btn {
    font-size: 16px;
    height: 32px;
    padding: 0 1rem;
  }
  .ant-steps-item-description {
    .ant-divider {
      margin: 0.75rem 0;
    }
  }
  .step-2-active-registration {
    .ant-typography {
      display: block;
      font-size: 14px;
    }
    .ant-table,
    .ant-input {
      font-size: 16px;
    }
  }
  .step-3-finished-registration {
    .ant-form,
    .terminate-btn {
      margin-top: 0.75rem;
    }
  }
  .step-2-active-registration {
    .ant-table {
      .ant-table-thead > tr > th,
      .ant-table-tbody > tr > td {
        padding: 6px 10px;
      }
    }
  }
  .step-4-deployed {
    > div {
      font-size: 16px;
    }
    .ant-table {
      font-size: 16px;
    }
  }

  /* table */
  .editable-cell {
    position: relative;
  }
  .editable-cell-value-wrap {
    padding: 5px 12px;
    cursor: pointer;
  }
  .editable-row:hover .editable-cell-value-wrap {
    padding: 4px 11px;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
  }
  .ant-form-item-explain.ant-form-item-explain-error {
    font-size: 16px;
  }
  [data-theme='dark'] .editable-row:hover .editable-cell-value-wrap {
    border: 1px solid #434343;
  }

  ${MEDIA_QUERY.mobileL} {
    .ant-radio-group {
      display: block;
    }
    .step-4-deployed {
      .ant-table-wrapper {
        width: 300px;
      }
    }
  }
`;

export const RadioLabel = styled(Text)`
  display: block;
  margin-bottom: 4px;
  padding: 4px 8px;
  font-size: 16px;
  line-height: normal;
  border: 1px solid;
  background: rgba(150, 150, 150, 0.1);
  border: 1px solid rgba(100, 100, 100, 0.2);
  border-radius: 4px;
  color: #00000087;
`;

export const GenericLabel = styled.div`
  color: ${COLOR.GREY_2};
  font-size: 16px;
  line-height: normal;
  margin-bottom: 0.5rem;
`;

export const InfoSubHeader = styled.div`
  display: flex;
  align-items: center;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: ${COLOR.BLACK};
`;
