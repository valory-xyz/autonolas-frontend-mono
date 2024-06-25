import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

export const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
`;

export const LogoContainer = styled.div`
  margin: 0;
  text-align: center;
  scale: 1.4;
  margin-bottom: 24px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
`;

export const PurpleDot = styled(Dot)`
  background-color: ${COLOR.PRIMARY};
`;

export const GreenDot = styled(Dot)`
  background-color: ${COLOR.GREEN_3};
`;

export const RedDot = styled(Dot)`
  background-color: ${COLOR.RED};
`;
