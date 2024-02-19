import { Agents } from 'components/Agents';
import styled from 'styled-components';

const AgentsContainer = styled.div`
  max-width: 800px;
  margin: auto;
`;

export const HomePage = () => <AgentsContainer><Agents /></AgentsContainer>;
