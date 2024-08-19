import { Button, Flex, Typography } from 'antd';
import Image from 'next/image';

import { SetNextStep } from '../types';

const { Title, Paragraph } = Typography;

export const Intro = ({ onNext }: { onNext: SetNextStep }) => (
  <Flex vertical align="center" gap={16}>
    <Image src={`/images/path/intro.svg`} alt="Intro" width={672} height={192} />
    <Title level={3} className="mb-0 mt-16">
      Launch your own agent economy with Olas
    </Title>
    <Paragraph type="secondary" className="mb-0">
      Create and deploy entire AI agent economies within your ecosystem efficiently. Here is a
      comprehensive step by step guide that will help you the entire agent economy as an Olas
      Launcher.
    </Paragraph>
    <Button type="primary" size="large" onClick={onNext}>
      View path
    </Button>
  </Flex>
);
