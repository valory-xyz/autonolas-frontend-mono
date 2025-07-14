import { Alert, Flex, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import Login from '../Login';

const { Paragraph } = Typography;

const ImageContainer = styled.div`
  max-width: 592px;
  width: 100%;

  img {
    position: relative !important;
  }
`;

export const ConnectWallet = () => (
  <>
    <Alert
      className="mb-12"
      type="warning"
      showIcon
      message="To be eligible to earn staking rewards you must associate your X profile with your wallet. Make sure to connect a suitable wallet before starting."
    />
    <Flex vertical gap={24} align="center" className="mt-24">
      <ImageContainer>
        <Image src="/images/set-up-staking.png" alt="Staking" layout="fill" objectFit="contain" />
      </ImageContainer>
      <Paragraph type="secondary" className="m-0">
        Spread the word about Olas on X and have a chance to earn rewards.
      </Paragraph>
      <Login />
    </Flex>
  </>
);
