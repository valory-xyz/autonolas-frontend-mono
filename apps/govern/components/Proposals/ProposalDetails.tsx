import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { Block } from 'viem';
import { mainnet } from 'viem/chains';
import { useAccount, useBlock } from 'wagmi';

import { Caption } from 'libs/ui-components/src';
import { areAddressesEqual } from 'libs/util-functions/src';
import { AddressLink } from 'libs/ui-components/src';

import { estimateFutureBlockTimestamp, getFullFormattedDate } from 'common-util/functions';
import { Proposal } from 'common-util/graphql/types';

import { VOTES_SUPPORT, formatWeiToEth } from './utils';
import { NA } from 'libs/util-constants/src';

const { Paragraph, Text } = Typography;

const useBlockTimestamp = (currentBlock: Block | undefined, block: bigint) => {
  // we can't get block data in the future, can only estimate instead
  const canLoadBlockData =
    currentBlock && currentBlock.number ? currentBlock.number > BigInt(block) : false;

  const blockData = useBlock({
    blockNumber: BigInt(block),
    chainId: mainnet.id,
    query: {
      enabled: canLoadBlockData,
    },
  });

  return {
    timestamp:
      canLoadBlockData && blockData.data
        ? blockData.data.timestamp
        : estimateFutureBlockTimestamp(currentBlock, block),
    isLoading: canLoadBlockData ? blockData.isLoading : false,
  };
};

export const ProposalDetails = ({
  item,
  currentBlock,
}: {
  item: Proposal;
  currentBlock?: Block | undefined;
}) => {
  const { address } = useAccount();

  const startDateBlock = useBlockTimestamp(currentBlock, BigInt(item.startBlock));
  const endDateBlock = useBlockTimestamp(currentBlock, BigInt(item.endBlock));

  return (
    <Flex vertical>
      <Caption>Proposal description</Caption>
      <Paragraph className="mb-16">{item.description}</Paragraph>
      <Caption>Owner</Caption>
      <AddressLink address={item.proposer} chainId={mainnet.id} className="mb-16" />
      <Flex gap={24} className="mb-16">
        <Flex vertical>
          <Caption>Start Date</Caption>
          {startDateBlock.isLoading && <Skeleton.Input active />}
          {startDateBlock.timestamp !== null && (
            <Text>{getFullFormattedDate(Number(startDateBlock.timestamp) * 1000)}</Text>
          )}
          {!startDateBlock.isLoading && startDateBlock.timestamp === null && NA}
        </Flex>
        <Flex vertical>
          <Caption>End Date</Caption>
          {endDateBlock.isLoading && <Skeleton.Input active />}
          {endDateBlock.timestamp !== null && (
            <Text>{getFullFormattedDate(Number(endDateBlock.timestamp) * 1000)}</Text>
          )}
        </Flex>
      </Flex>
      <Flex vertical gap={8} className="mb-16">
        <Caption>Voters ({item.voteCasts?.length})</Caption>
        {item.voteCasts.map((vote, index) => (
          <Row key={vote.id} gutter={[0, 8]}>
            <Col span={5}>
              <AddressLink address={vote.voter} chainId={mainnet.id} />
              {address && areAddressesEqual(vote.voter, address) && ' (you)'}
            </Col>
            <Col span={2}>{formatWeiToEth(vote.weight)}</Col>
            <Col>({VOTES_SUPPORT[vote.support]})</Col>
          </Row>
        ))}
      </Flex>
      <Caption>Proposal ID</Caption>
      <Paragraph className="mb-16">{item.id}</Paragraph>
    </Flex>
  );
};
