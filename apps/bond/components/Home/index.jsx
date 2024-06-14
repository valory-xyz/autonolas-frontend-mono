import { Paths } from 'components/Paths';
import styled from 'styled-components';
import { Hero } from 'components/Home/Hero';
import StyledMain from 'components/GlobalStyles/StyledMain';

const PathsContainer = styled.div`
  margin: auto 0;
`;

export const HomePage = () => (
  <StyledMain>
    <Hero />
    <PathsContainer>
      <Paths />
    </PathsContainer>
  </StyledMain>
);
