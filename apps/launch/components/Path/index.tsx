import { Card, Flex, Steps } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { steps } from './constants';
import { SetNextStep, SetPrevStep, StepComponentProps } from './types';
import { BREAK_POINT } from 'libs/ui-theme/src';

const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: ${BREAK_POINT.xl};
  margin: 0 auto;

  .ant-steps.ant-steps-vertical > .ant-steps-item:not(:last-child) .ant-steps-item-content {
    min-height: 58px;
  }
`;

const StepContentStyle = { maxWidth: '720px', width: '100%' };

const renderStep = (
  StepComponent: React.ComponentType<StepComponentProps>,
  setPrevStep: SetPrevStep,
  setNextStep: SetNextStep,
  isLastStep: boolean,
) => <StepComponent onPrev={setPrevStep} onNext={setNextStep} isLastStep={isLastStep} />;

export const PathPage = () => {
  const [step, setStep] = useState(0);

  const isLastStep = step === steps.length - 1;

  const setPrevStep = () => setStep((prev) => (prev === 0 ? prev : prev - 1));
  const setNextStep = () =>
    setStep((prev) =>
      // If on the last step, loop back to the first
      // otherwise go next
      prev === steps.length - 1 ? 0 : prev + 1,
    );

  return (
    <StyledMain>
      <Flex gap={24} align="start">
        <Card>
          <Steps direction="vertical" current={step} items={steps} />
        </Card>
        <Card style={StepContentStyle}>
          {renderStep(steps[step].content, setPrevStep, setNextStep, isLastStep)}
        </Card>
      </Flex>
    </StyledMain>
  );
};
