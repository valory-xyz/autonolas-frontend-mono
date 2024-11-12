import { Paths } from 'components/Paths';
import styled from 'styled-components';

const PathsContainer = styled.div`
  max-width: 1400px;
  margin: auto;
`;

export const HomePage = () => (
  <>
    <Meta />
    <PathsContainer>
      <Paths />
    </PathsContainer>
  </>
);
