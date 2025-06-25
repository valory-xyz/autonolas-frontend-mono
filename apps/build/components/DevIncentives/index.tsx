import { Typography } from 'antd';
import styled from 'styled-components';

import { Checkpoint } from './Checkpoint';
import { ClaimIncentives } from './ClaimIncentives';
import { IncentivesForNextEpoch } from './IncentivesForNextEpoch';
import { IncentivesForThisEpoch } from './IncentivesForThisEpoch';

const { Title, Paragraph } = Typography;

const DevIncentivesContainer = styled.div`
  padding-bottom: 24px;
`;

export const DevIncentives = () => (
  <DevIncentivesContainer>
    <Title level={2} className="mt-0">
      Developer Rewards
    </Title>
    <Paragraph style={{ maxWidth: 550 }}>
      The protocol rewards developers who contribute useful units of code. Units
      can be agents or components. Check available rewards and claim them if you
      have any outstanding.
    </Paragraph>

    <IncentivesForThisEpoch />
    <br />

    <Checkpoint />

    <ClaimIncentives />
    <br />

    <IncentivesForNextEpoch />
  </DevIncentivesContainer>
);
