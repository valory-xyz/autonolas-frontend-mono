import { EditOutlined } from '@ant-design/icons';
import { Divider } from 'antd';

import { StepContent, StepList } from '../StepContent';
import { StepComponentProps } from '../types';

const createDocData = {
  title: 'Create a short document that touches on the use case and market need.',
  items: [
    'What are the goals you have for your chain ecosystem and the KPIs you are trying to hit?',
    'What is the market need for autonomous AI agents in your ecosystem?',
    'What is the use case that can satisfy this need?',
  ],
};

const defineKPIsData = {
  title: 'Define KPIs & Goals.',
  items: [
    'What are the goals for the agents and what KPIs will define success?',
    'What are the goals and KPIs of the agent economy?',
  ],
};

export const Define = ({ onPrev, onNext, isLastStep }: StepComponentProps) => (
  <StepContent
    icon={EditOutlined}
    title="Define your goals and KPIs"
    onPrev={onPrev}
    onNext={onNext}
    isLast={isLastStep}
  >
    <StepList title={createDocData.title} items={createDocData.items} />
    <Divider className="m-0" />
    <StepList title={defineKPIsData.title} items={defineKPIsData.items} />
  </StepContent>
);
