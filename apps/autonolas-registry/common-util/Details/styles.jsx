import { Image, Statistic, Typography } from 'antd';
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
  word-break: break-all;
  li {
    .ant-btn-link {
      padding: 0;
      height: auto;
    }
  }
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

export const RewardsStatistic = styled((props) => <Statistic {...props} />)`
  .ant-statistic-title {
    font-size: 14px;
    line-height: 20px;
  }
  .ant-statistic-content {
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 32px;
    letter-spacing: -0.72px;
  }
  .ant-skeleton-title {
    margin: 0;
    max-width: 200px;
  }
  .ant-statistic-skeleton {
    padding-top: 12px;
  }
`;
