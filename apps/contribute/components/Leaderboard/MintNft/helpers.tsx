import { Space, Typography } from 'antd';
import Image from 'next/image';

import { MintBadgeCardContainer } from './styles';

const { Text } = Typography;

export const MintBadgeCard = () => (
  <MintBadgeCardContainer>
    <Space direction="vertical">
      <Space style={{ display: 'flex', flexDirection: 'column' }}>
        <Image
          priority
          src="/images/badge-evolution.png"
          alt="Mint NFT"
          width={444}
          height={208}
          className="mint-nft-image"
        />
      </Space>

      <Text>Mint your badge, watch it evolve as you contribute</Text>
      <Text type="secondary">To mint, connect a wallet</Text>
    </Space>
  </MintBadgeCardContainer>
);
