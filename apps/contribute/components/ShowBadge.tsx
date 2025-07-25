import { LinkOutlined } from '@ant-design/icons';
import { Skeleton, Typography } from 'antd';
import Image from 'next/image';
import styled from 'styled-components';

import { isGoerli } from '@autonolas/frontend-library';

import { useAppSelector } from 'store/setup';

import { getAutonolasTokenUri } from './Leaderboard/MintNft/utils';

const IMAGE_SIZE = 160;
const { Text } = Typography;

type ShowBadgeProps = {
  image: string;
  tokenId?: string | null;
};

export const ShowBadge = ({ image, tokenId }: ShowBadgeProps) => {
  const chainId = useAppSelector((state) => state?.setup?.chainId);

  if (chainId === null) {
    throw new Error('ChainId is null.');
  }

  // TODO: to be removed
  const openSeaUrl = isGoerli(chainId)
    ? 'https://testnets.opensea.io/assets/goerli/0x7c3b976434fae9986050b26089649d9f63314bd8'
    : 'https://opensea.io/assets/ethereum/0x02c26437b292d86c5f4f21bbcce0771948274f84';

  return (
    <>
      <Image
        src={getAutonolasTokenUri(image)}
        alt="NFT"
        width={IMAGE_SIZE}
        height={IMAGE_SIZE}
        className="nft-image"
      />
      {tokenId && (
        <Text type="secondary" className="mt-12">
          <a href={`${openSeaUrl}/${tokenId}`} target="_blank" rel="noreferrer">
            View on OpenSea&nbsp;
            <LinkOutlined />
          </a>
        </Text>
      )}
    </>
  );
};

export const BadgeLoadingContainer = styled(Skeleton.Image)`
  &.ant-skeleton {
    border-radius: 1rem;
    width: ${IMAGE_SIZE}px;
    height: ${IMAGE_SIZE}px;
    .ant-skeleton-image {
      width: 100%;
      height: 100%;
      > svg {
        transform: scale(1.5);
      }
    }
  }
`;

export const BadgeLoading = () => <BadgeLoadingContainer active />;
