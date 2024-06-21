import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

export const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
`;

export const LogoContainer = styled.div`
  margin: 0;
  text-align: center;
  scale: 1.4;
`;

export const PurpleDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${COLOR.PRIMARY};
  display: inline-block;
  margin-right: 8px;
`;
