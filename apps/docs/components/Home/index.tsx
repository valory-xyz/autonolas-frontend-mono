import { Flex, Typography } from 'antd';
import Image from 'next/image';
import { ContentContainer, Hero } from '../Layout/styles';
import { WhatIsOlas } from './WhatIsOlas';
import { WhatCanIUse } from './WhatCanIUse';
import { StayInTouch } from './StayInTouch';
import { TheDocs } from './TheDocs';
import { GetInvolved } from './GetInvolved';

const { Title, Text } = Typography;

const HeroSection = () => (
  <Hero>
    <Flex align="center" vertical gap={24}>
      <Image src="/docs.png" alt="Olas docs" width={160} height={160} className="mb-16" />
      <Title style={{ fontSize: 48 }} className="m-0">
        Olas Docs
      </Title>
      <Text>Explore what Olas is, what you can build and use, and how to get involved.</Text>
    </Flex>
  </Hero>
);

export const HomePage = () => (
  <>
    <HeroSection />
    <ContentContainer>
      <WhatIsOlas />
      <WhatCanIUse />
      <GetInvolved />
      <StayInTouch />
      <TheDocs />
    </ContentContainer>
  </>
);
