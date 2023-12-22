import styled from 'styled-components';
import { Layout } from '../components/Layout';

const StyledPage = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 3rem;
  font-family: texgyreheros__regular, sans-serif;
`;

export function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.styled-components file.
   */
  return (
    <StyledPage>
      <Layout />
    </StyledPage>
  );
}

export default Index;
