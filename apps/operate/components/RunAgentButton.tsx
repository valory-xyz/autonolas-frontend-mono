import { Button, Flex } from 'antd';
import { BaseButtonProps } from 'antd/es/button/button';
import { NotificationOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { StakingContract } from 'types';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

type RunAgentButtonProps = {
  availableOn: StakingContract['availableOn'];
  type?: BaseButtonProps['type'];
  className?: string;
};

const props = {
  pearl: {
    icon: <Image src={`/images/pearl.svg`} alt="Pearl app" width={18} height={18} />,
    text: 'Pearl',
    href: 'https://olas.network/operate#download',
  },
  quickstart: {
    icon: <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />,
    text: 'Quickstart',
    href: 'https://github.com/valory-xyz/trader-quickstart?tab=readme-ov-file#trader-quickstart',
  },
  optimusQuickstart: {
    icon: <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />,
    text: 'Quickstart',
    href: 'https://github.com/valory-xyz/optimus-quickstart',
  },
  modiusQuickstart: {
    icon: <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />,
    text: 'Quickstart',
    href: 'https://github.com/valory-xyz/modius-quickstart?tab=readme-ov-file#olas-modius-quickstart',
  },
  contribute: {
    icon: <NotificationOutlined width={18} height={18} />,
    text: 'Contribute',
    href: 'https://contribute.olas.network/staking',
  },
};
export const RunAgentButton = ({ availableOn, type = 'text', className }: RunAgentButtonProps) => {
  if (availableOn === null) {
    return (
      <Button type={type} className={className} disabled>
        Not available yet
      </Button>
    );
  }

  const agentProps = props[availableOn];
  return (
    <Button type={type} className={className} href={agentProps.href} target="_blank">
      <Flex gap={8} align="center" justify="center">
        {agentProps.icon} {agentProps.text} {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Flex>
    </Button>
  );
};
