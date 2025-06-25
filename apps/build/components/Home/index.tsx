import { Paths } from "components/Paths";
import styled from "styled-components";
import Meta from "components/Meta";

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
