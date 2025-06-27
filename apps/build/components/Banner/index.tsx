import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';
import styled from 'styled-components';

const StyledBanner = styled.div`
  background-color: ${COLOR.BLACK};
  color: ${COLOR.WHITE};
  padding: 15px;
  text-align: center;
  margin-top: 64px;
  margin-bottom: 24px;
  ${MEDIA_QUERY.tablet} {
    margin-top: 0;
  }
`;

export const Banner = ({ children }: { children: React.ReactNode }) => (
  <StyledBanner>{children}</StyledBanner>
);
