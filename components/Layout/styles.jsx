import styled from 'styled-components';
import { Layout } from 'antd/lib';
import { COLOR, MEDIA_QUERY } from 'util/theme';

export const CustomLayout = styled(Layout)``;

// HEADER
export const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px;
  background-color: ${COLOR.WHITE};
  line-height: normal;

  ${MEDIA_QUERY.tablet} {
    margin-bottom: 0;
    .column-1 {
      line-height: normal;
    }
  }

  /* nav-bar for pages except landing-page */
  ${MEDIA_QUERY.mobileL} {
    margin-bottom: 0;
  }

  ${MEDIA_QUERY.mobileM} {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

export const Logo = styled.div`
  max-width: 280px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: left;
  margin-left: 0.5rem;
  margin-right: 3.5rem;
  font-size: 34px;
  color: ${COLOR.PRIMARY};
  span {
    margin-left: 1rem;
    font-weight: bold;
  }
`;

// FOOTER
export const Container = styled.div`
  margin-top: 2rem;
  font-size: 20px;
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

  ${MEDIA_QUERY.tabletL} {
  }

  ${MEDIA_QUERY.tablet} {
    position: relative;
    flex-direction: column;
    font-size: 16px;
    padding: 2rem 0.75rem 1.5rem 0.75rem;
  }

  ${MEDIA_QUERY.mobileS} {
  }
`;
