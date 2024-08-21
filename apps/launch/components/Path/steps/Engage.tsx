import { CodeOutlined } from '@ant-design/icons';
import { Divider, Typography } from 'antd';
import Link from 'next/link';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';

import { StepContent, StepList } from '../StepContent';
import { StepComponentProps } from '../types';

const { Text } = Typography;

const developData = {
  title: 'Develop your agent services.',
  items: [
    <>
      Develop it yourself using the{' '}
      <a href="https://docs.autonolas.network" target="_blank" rel="noopener noreferrer">
        docs {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
      .
    </>,
    <>
      Develop it yourself by attending the academy -{' '}
      <a href="https://www.valory.xyz/academy" target="_blank" rel="noopener noreferrer">
        sign up {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
      .
    </>,
    <>
      Get matched with a qualified Builder -{' '}
      <a href="mailto:bd@valory.xyz" target="_blank" rel="noopener noreferrer">
        enquire {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </a>
      .
    </>,
  ],
};

export const Engage = ({ onPrev, onNext, isLastStep }: StepComponentProps) => {
  const { networkName } = useAppSelector((state) => state.network);

  return (
    <StepContent
      icon={CodeOutlined}
      title="Engage Builders to architect & develop the agents"
      onPrev={onPrev}
      onNext={onNext}
      isLast={isLastStep}
    >
      <StepList title={developData.title} items={developData.items} />
      <Divider className="m-0" />
      <Text>
        <Link href={`/${networkName || 'ethereum'}/${URL.myStakingContracts}`}>
          Create the Olas staking contract{' '}
        </Link>{' '}
        and embed the KPIs for autonomous AI agents to hit.
      </Text>
      <Divider className="m-0" />
      <Text>Test the agent economy.</Text>
      <Divider className="m-0" />
      <Text>Deploy the staking contracts.</Text>
    </StepContent>
  );
};
