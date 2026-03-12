import { Card, Flex, Segmented } from 'antd';
import styled, { createGlobalStyle } from 'styled-components';

import { FILTER_CONTROL_HEIGHT, FILTER_DROPDOWN_CLASS, PLATFORM_SELECT_CLASS } from './constants';

export const StyledMain = styled.main`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 32px;
  margin: 0 auto;

  @media (min-width: 2560px) {
    max-width: 1400px;
  }
`;

export const StyledCard = styled(Card)`
  border-width: 16px;
`;

export const TableWrapper = styled.div`
  .ant-table-thead > tr > th {
    white-space: nowrap;
  }
`;

export const FilterRow = styled(Flex)`
  font-size: 14px;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  .ant-input-affix-wrapper,
  .ant-select-selector,
  .ant-tag {
    padding: 8px 12px !important;
    font-size: 14px;
  }
  .ant-input-affix-wrapper,
  .ant-select .ant-select-selector {
    height: ${FILTER_CONTROL_HEIGHT}px !important;
    min-height: ${FILTER_CONTROL_HEIGHT}px !important;
    display: flex !important;
    align-items: center !important;
  }
  .ant-select-single .ant-select-selector {
    padding: 8px 12px !important;
  }
`;

export const PlatformSelectWrap = styled.div`
  position: relative;
  min-width: 220px;

  .${PLATFORM_SELECT_CLASS}.ant-select .ant-select-selector {
    padding: 2px 8px !important;
    height: ${FILTER_CONTROL_HEIGHT}px !important;
    min-height: ${FILTER_CONTROL_HEIGHT}px !important;
  }
  .${PLATFORM_SELECT_CLASS}.ant-select .ant-select-selection-placeholder {
    visibility: hidden;
  }
  .${PLATFORM_SELECT_CLASS}.ant-select-multiple .ant-select-selection-item {
    padding: 2px 8px !important;
    margin-inline-end: 4px !important;
  }
`;

export const PlatformSelectLabel = styled.span`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  ${PlatformSelectWrap}:has(.ant-select-open) & {
    color: rgba(0, 0, 0, 0.25);
  }
`;

export const FilterDropdownStyles = createGlobalStyle`
  .${FILTER_DROPDOWN_CLASS} .ant-select-item {
    padding: 8px 12px !important;
    font-size: 14px;
    min-height: unset;
  }
  .${FILTER_DROPDOWN_CLASS} .ant-select-item-option-content {
    display: flex;
    align-items: center;
  }
`;

export const LiveNotAvailableSwitch = styled(Segmented)`
  background: #e0e3eb !important;
  border-radius: 8px !important;
  margin-bottom: 16px !important;

  .ant-segmented-group {
    background: transparent !important;
  }
  .ant-segmented-thumb {
    background: #ffffff !important;
    border-radius: 6px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .ant-segmented-item {
    color: #6c757d !important;
    border-radius: 6px !important;
  }
  .ant-segmented-item-selected {
    color: #333333 !important;
  }
  .ant-segmented-item-label {
    padding: 6px 16px;
  }
`;
