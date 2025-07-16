import styled from 'styled-components';

import { useModuleUtilities } from 'common-util/hooks/useModuleUtilities';

const StyledPre = styled.pre`
  max-width: 800px;
  overflow-x: auto;
`;

const StatePage = () => {
  const { moduleDetails } = useModuleUtilities();

  return <StyledPre>{JSON.stringify(moduleDetails, undefined, 2)}</StyledPre>;
};

export default StatePage;
