import { FileDoneOutlined } from '@ant-design/icons';

import { StepContent, StepList } from '../StepContent';
import { StepComponentProps } from '../types';

const putTogetherData = {
  title:
    'Put together a technical document that specifies how each agent in your economy will be designed, architected and how they interact with one another.',
  items: [
    'What do you want the individual agents to do?',
    'How many agent instances of each type are required?',
    // TODO: uncomment once it's clear what the link should be
    // <>
    //   Translate KPI definitions in a staking contract specification. See the{' '}
    //   <a
    //     href="https://github.com/valory-xyz/autonolas-aip/blob/aip-2/docs/OlasAutomate.pdf"
    //     target="_blank"
    //     rel="noopener noreferrer"
    //   >
    //     Olas Predict Specification Document {UNICODE_SYMBOLS.EXTERNAL_LINK}
    //   </a>{' '}
    //   example.
    // </>,
  ],
};

export const Design = ({ onPrev, onNext, isLastStep }: StepComponentProps) => (
  <StepContent
    icon={FileDoneOutlined}
    title="Design and specify your agent economy"
    onPrev={onPrev}
    onNext={onNext}
    isLast={isLastStep}
  >
    <StepList title={putTogetherData.title} items={putTogetherData.items} />
  </StepContent>
);
