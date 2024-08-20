import { Card, Flex, Steps } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { BREAK_POINT } from 'libs/ui-theme/src';

import { LAST_STEP_KEY, steps } from './constants';
import { SetNextStep, SetPrevStep, StepComponentProps } from './types';

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
  const [step, setStep] = useState(Number(sessionStorage.getItem(LAST_STEP_KEY) || '0'));

  const isLastStep = step === steps.length - 1;

  const onChangeStep = (value: number) => {
    setStep(value);
    sessionStorage.setItem(LAST_STEP_KEY, value.toString());
  };

  const setPrevStep = () => {
    const prevStep = step === 0 ? step : step - 1;
    onChangeStep(prevStep);
  };

  const setNextStep = () => {
    const nextStep = isLastStep ? 0 : step + 1;
    onChangeStep(nextStep);
  };

  return (
    <StyledMain>
      <Flex gap={24} align="start">
        <Card>
          <Steps direction="vertical" current={step} items={steps} onChange={onChangeStep} />
        </Card>
        <Card style={StepContentStyle}>
          {renderStep(steps[step].content, setPrevStep, setNextStep, isLastStep)}
        </Card>
      </Flex>
    </StyledMain>
  );
};
