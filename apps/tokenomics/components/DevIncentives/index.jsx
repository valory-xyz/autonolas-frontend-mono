import { Typography } from 'antd';

import { ClaimIncentives } from './ClaimIncentives';
import { IncentivesForThisEpoch } from './IncentivesForThisEpoch';
import { IncentivesForNextEpoch } from './IncentivesForNextEpoch';
import { Checkpoint } from './Checkpoint';

const { Title, Paragraph } = Typography;

export const DevIncentives = () => (
  <div>
    <Title level={2}>Developer Rewards</Title>
    <Paragraph style={{ maxWidth: 550 }}>
      The protocol rewards developers who contribute useful units of code. Units
      can be agents or components. Check available rewards and claim them if you
      have any outstanding.
    </Paragraph>

    <IncentivesForThisEpoch />
    <br />
    <br />

    <Checkpoint />

    <ClaimIncentives />
    <br />
    <br />

    <IncentivesForNextEpoch />
  </div>
);
