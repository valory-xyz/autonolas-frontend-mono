import { LineChartOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import Image from 'next/image';

import { StepContent } from '../StepContent';
import { StepComponentProps } from '../types';

const { Text } = Typography;

export const Watch = ({ onPrev, onNext, isLastStep }: StepComponentProps) => (
  <StepContent
    icon={LineChartOutlined}
    title="Watch your metrics grow"
    onPrev={onPrev}
    onNext={onNext}
    isLast={isLastStep}
  >
    <Image src={`/images/path/finish.svg`} alt="Finish" width={672} height={128} />
    <Flex justify="center" align="center" gap={4}>
      <Text type="secondary">Sit back and relax as AI agents become your DAUs</Text>
      <Image src={`/images/path/robot.svg`} alt="Robot icon" width={20} height={20} />
    </Flex>
  </StepContent>
);
