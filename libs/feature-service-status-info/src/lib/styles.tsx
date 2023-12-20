import styled from 'styled-components';
import {
  BORDER_RADIUS,
  BOX_SHADOW,
  COLOR,
  MEDIA_QUERY,
} from '@autonolas-frontend-mono/ui-theme';

export const StickyContainer = styled.div`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  line-height: normal;
  z-index: 1000;
`;

export const Logo = styled.div`
  width: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-left: 0.5rem;
  span {
    margin-left: 0.5rem;
  }
`;

export const RightMenu = styled.div`
  display: flex;
  align-items: center;

  ${MEDIA_QUERY.tablet} {
    line-height: normal;
  }
`;

export const OffChainContainer = styled.div`
  margin-right: 1.5rem;
`;

export const MobileOffChainContainer = styled.div`
  display: flex;
  align-items: center;
  div:nth-child(2) {
    font-size: 16px;
  }
  .extra-md-view {
    display: flex;
    margin-left: 1rem;
  }
`;

type InfoType = {
  canMinimize: boolean;
};
export const ContractsInfoContainer = styled(StickyContainer)<InfoType>`
  right: 1rem;
  display: flex;
  align-items: center;
  background: ${COLOR.WHITE};
  border: 1px solid ${COLOR.GREY_4};
  box-shadow: ${BOX_SHADOW.light};
  border-radius: ${BORDER_RADIUS};
  font-size: 16px;
  padding: ${({ canMinimize }) => (canMinimize ? `12px` : `20px`)};
  transition: all 0.3s;
  .status-sub-header {
    text-transform: uppercase;
    font-size: 14px;
    line-height: 17px;
    letter-spacing: 0.04em;
  }
  .status-sub-content {
    display: flex;
    align-items: center;
    line-height: 1.75;
    font-size: 18px;
  }
  .dot {
    display: inline-block;
    position: relative;
    top: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }
  .dot-online {
    background-color: ${COLOR.GREEN_3};
  }
  .dot-offline {
    background-color: ${COLOR.ORANGE};
  }
  .minimize-btn {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
  }
  .ant-statistic-content-suffix {
    margin-left: 0px;
  }

  ${MEDIA_QUERY.mobileL} {
    font-size: 14px;
    padding: 0.5rem;
  }
`;

export const Badge = styled.div<{ canMinimize: boolean }>`
  display: flex;
  margin-right: 1rem;
  a {
    line-height: normal;
    height: ${({ canMinimize }) => (canMinimize ? '58px' : '72px')};
  }

  ${MEDIA_QUERY.mobileL} {
    margin-right: 0.5rem;
  }
`;

export const NextUpdateTimer = styled.div`
  display: inline-flex;
  align-items: center;
  .ant-statistic {
    color: inherit;
  }
  .ant-statistic-content {
    font-weight: inherit;
    font-size: inherit;
    color: inherit;
  }
`;

export const FixedFooter = styled.div`
  position: fixed;
  bottom: 0;
  background: ${COLOR.WHITE};
  width: 100%;
  border-top: 1px solid ${COLOR.GREY_3};
`;

export const ExtraContent = styled.div`
  display: flex;
  align-items: center;
  > div {
    &:not(:last-child) {
      margin-right: 1.5rem;
    }
  }
`;
