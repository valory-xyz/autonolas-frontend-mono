import styled from 'styled-components';

/* eslint-disable-next-line */
export interface FeatureServiceStatusInfoProps {}

const StyledFeatureServiceStatusInfo = styled.div`
  color: pink;
`;

export function FeatureServiceStatusInfo(props: FeatureServiceStatusInfoProps) {
  return (
    <StyledFeatureServiceStatusInfo>
      <h1>Welcome to FeatureServiceStatusInfo!</h1>
    </StyledFeatureServiceStatusInfo>
  );
}

export default FeatureServiceStatusInfo;
