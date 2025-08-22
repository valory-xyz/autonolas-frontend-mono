import { Divider, Image, Table, TableProps, Typography } from 'antd';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

export const DetailsTitle = styled(Typography.Title)`
  text-transform: capitalize;
  margin: 0 !important;
`;

export const SubTitle = styled(Typography.Text)`
  margin-top: 0.5rem;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  .right-content {
    .ant-btn {
      margin-left: 1rem;
    }
  }
`;

export const Info = styled.div`
  word-break: break-word;

  .grid-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    align-items: center;
    gap: 12px;
    padding: 6px 0;

    &.text-only {
      padding: 0;
      > .info-text {
        padding: 7px 15px;
      }
    }
  }

  li {
    .ant-btn-link {
      padding: 0;
      height: auto;
    }
  }

  @media (max-width: 600px) {
    .grid-row {
      grid-template-columns: 1fr;
      align-items: flex-start;
    }
  }
`;

export const DetailsTable = styled(<T extends object>(props: TableProps<T>) => (
  <Table {...props} />
))`
  button {
    padding: 0;
  }
`;

export const DetailsDivider = styled(Divider)`
  margin-top: 0;
  margin-bottom: 7px;
`;

export const EachSection = styled.div`
  padding-top: 1.25rem;
`;

export const NftImageContainer = styled(Image)`
  border: 1px solid ${COLOR.BORDER_GREY};
`;

export const ServiceStatusContainer = styled.div`
  display: inline-block;
  &.active svg {
    fill: ${COLOR.GREEN_4};
    color: ${COLOR.GREEN_4};
  }
  &.inactive svg {
    fill: ${COLOR.RED};
    color: ${COLOR.RED};
  }
  svg {
    top: -1px;
    margin-right: 6px;
    position: relative;
  }
`;

export const SectionContainer = styled.div`
  margin-right: 1rem;
  ${EachSection} {
    &:first-child {
      border-top-left-radius: 1rem;
      border-top-right-radius: 1rem;
    }
    &:last-child {
      border-bottom-left-radius: 1rem;
      border-bottom-right-radius: 1rem;
      border-bottom-color: ${COLOR.BORDER_GREY};
    }
  }
  .ant-form-item-label > label {
    left: -4px;
  }
`;
