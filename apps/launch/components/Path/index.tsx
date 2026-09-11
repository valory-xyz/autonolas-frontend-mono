import { Card, Flex, Steps } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { BREAK_POINT } from 'libs/ui-theme/src';

import { steps } from './constants';
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

const STEP_CONTENT_STYLE = { maxWidth: '720px', width: '100%' };
const LAST_STEP_KEY = 'path_last_step';

const renderStep = (
  StepComponent: React.ComponentType<StepComponentProps>,
  setPrevStep: SetPrevStep,
  setNextStep: SetNextStep,
  isLastStep: boolean,
) => <StepComponent onPrev={setPrevStep} onNext={setNextStep} isLastStep={isLastStep} />;

export const PathPage = () => {
  const [step, setStep] = useState(0);

  const isLastStep = step === steps.length - 1;

  const onChangeStep = (value: number) => {
    setStep(value);
    window.sessionStorage.setItem(LAST_STEP_KEY, value.toString());
  };

  const setPrevStep = () => {
    const prevStep = step === 0 ? step : step - 1;
    onChangeStep(prevStep);
  };

  const setNextStep = () => {
    const nextStep = isLastStep ? 0 : step + 1;
    onChangeStep(nextStep);
  };

  useEffect(() => {
    setStep(Number(window.sessionStorage.getItem(LAST_STEP_KEY) || '0'));
  }, []);

  return (
    <StyledMain>
      <Flex gap={24} align="start">
        <Card>
          <Steps direction="vertical" current={step} items={steps} onChange={onChangeStep} />
        </Card>
        <Card style={STEP_CONTENT_STYLE}>
          {/* Every step is rendered, not just the selected one. A crawler fetches this page
              once, so rendering only `steps[step]` published one step of six and gave no sign
              the rest existed. Only the selected panel is visible; the others are `hidden`, so
              the page looks and behaves exactly as before for anyone running the app. */}
          {steps.map(({ title, content }, index) => (
            <div key={title} hidden={index !== step}>
              {renderStep(content, setPrevStep, setNextStep, index === steps.length - 1)}
            </div>
          ))}
        </Card>
      </Flex>
    </StyledMain>
  );
};
