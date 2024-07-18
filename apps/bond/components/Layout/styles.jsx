import { Layout } from 'antd';
import styled from 'styled-components';

import { COLOR, MEDIA_QUERY } from 'libs/ui-theme/src';

export const CustomLayout = styled(Layout)`
  ${MEDIA_QUERY.tablet} {
    .ant-menu.ant-menu-horizontal {
      width: 100%;
    }
  }
  ${MEDIA_QUERY.mobileL} {
    .footer-center {
      display: none;
    }
  }
  ${MEDIA_QUERY.mobileM} {
    .ant-layout-header {
      .ant-menu-overflow-item {
        line-height: 2;
      }
    }
  }
`;

export const SubFooter = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0.5rem;
  padding: 2rem 1rem;
  border: 1px solid ${COLOR.GREY_1};
  border-radius: 0px 0px 20px 20px;
  border-top-color: transparent;

  ${MEDIA_QUERY.tablet} {
    position: relative;
    flex-direction: column;
    font-size: 16px;
    padding: 2rem 0.75rem 1.5rem 0.75rem;
  }
`;

export const ContractsInfoContainer = styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  .mech-contract {
    display: flex;
    align-items: center;
  }
  img {
    margin-right: 8px;
  }
`;

export const DocsLink = styled.div`
  svg {
    width: 12px;
    margin-left: 4px;
    margin-bottom: -1px;
  }
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: left;
  max-width: 248px;
  margin-left: 0.5rem;
  margin-right: 1.5rem;
  font-size: 34px;
  color: ${COLOR.PRIMARY};
  cursor: pointer;
  svg {
    flex: 60px;
  }
  span {
    margin-left: 1rem;
    font-weight: bold;
    line-height: 1.2;
  }
`;
