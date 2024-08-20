import { SoundOutlined } from '@ant-design/icons';
import { Divider, Typography } from 'antd';

import { StepContent } from '../StepContent';
import { StepComponentProps } from '../types';

const { Text } = Typography;

export const Promote = ({ onPrev, onNext, isLastStep }: StepComponentProps) => {
  return (
    <StepContent
      icon={SoundOutlined}
      title="Promote and co-market your agent economy & observe as Operators run your agents"
      onPrev={onPrev}
      onNext={onNext}
      isLast={isLastStep}
    >
      <Text>Showcase your agent economy and how it all works.</Text>
      <Divider className="m-0" />
      <Text>
        Market your agent economy by engaging with the broad and diverse Olas community of Builders,
        Operators, and others.
      </Text>
      <Divider className="m-0" />
      <Text>Enable and incentivize operators to run your agent economy.</Text>
      <Divider className="m-0" />
      <Text>Advertise the staking contracts to Governors to direct emissions.</Text>
    </StepContent>
  );
};
