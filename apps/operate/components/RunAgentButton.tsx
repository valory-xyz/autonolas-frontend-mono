import { Button, Flex } from 'antd';
import { BaseButtonProps } from 'antd/es/button/button';
import { NotificationOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { AvailableOn } from 'types';

import { QUICKSTART_REPO_URL, UNICODE_SYMBOLS } from 'libs/util-constants/src';

type RunAgentButtonProps = {
  availableOn: AvailableOn;
  type?: BaseButtonProps['type'];
  className?: string;
};

const QUICKSTART_URL = `${QUICKSTART_REPO_URL}?tab=readme-ov-file#olas-agents---quickstart`;

const props = {
  pearl: {
    icon: <Image src={`/images/pearl.svg`} alt="Pearl app" width={18} height={18} />,
    text: 'Pearl',
    href: 'https://olas.network/operate#download',
  },
  quickstart: {
    icon: <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />,
    text: 'Quickstart',
    href: QUICKSTART_URL,
  },
  optimusQuickstart: {
    icon: <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />,
    text: 'Quickstart',
    href: QUICKSTART_URL,
  },
  modiusQuickstart: {
    icon: <Image src={`/images/github.svg`} alt="Github" width={18} height={18} />,
    text: 'Quickstart',
    href: QUICKSTART_URL,
  },
  contribute: {
    icon: <NotificationOutlined width={18} height={18} />,
    text: 'Contribute',
    href: 'https://contribute.olas.network/staking',
  },
};
export const RunAgentButton = ({ availableOn, type = 'text', className }: RunAgentButtonProps) => {
  const agentProps = props[availableOn];
  return (
    <Button type={type} className={className} href={agentProps.href} target="_blank">
      <Flex gap={8} align="center" justify="center">
        {agentProps.icon} {agentProps.text} {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Flex>
    </Button>
  );
};
