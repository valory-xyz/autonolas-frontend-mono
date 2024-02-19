import { Paths } from 'components/Paths';
import styled from 'styled-components';

const PathsContainer = styled.div`
  max-width: 800px;
  margin: auto;
`;

export const HomePage = () => (
  <PathsContainer>
    <Paths />
  </PathsContainer>
);
