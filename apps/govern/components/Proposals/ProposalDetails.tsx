import { LinkOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Flex, Row, Skeleton, Typography } from 'antd';
import { Block } from 'viem';
import { mainnet } from 'viem/chains';
import { useAccount, useBlock } from 'wagmi';

import { Caption } from 'libs/ui-components/src';
import { areAddressesEqual, notifySuccess } from 'libs/util-functions/src';
import { AddressLink } from 'libs/ui-components/src';

import {
  estimateFutureBlockTimestamp,
  formatDuration,
  getFullFormattedDate,
} from 'common-util/functions';
import { Proposal } from 'common-util/graphql/types';
import { useProposalEta } from 'hooks/useProposalEta';

import { DAO_CONSTITUTION_URL, getFlaggedProposal } from './flaggedProposals';
import { VOTES_SUPPORT, formatWeiToEth } from './utils';
import { EXPLORER_URLS, NA, UNICODE_SYMBOLS } from 'libs/util-constants/src';

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
  const flagged = getFlaggedProposal(item.proposalId);

  const startDateBlock = useBlockTimestamp(currentBlock, BigInt(item.startBlock));
  const endDateBlock = useBlockTimestamp(currentBlock, BigInt(item.endBlock));

  // A queued proposal sits in the timelock until its ETA, after which it can be executed.
  const isWaitingToExecute = item.isQueued && !item.isExecuted && !item.isCancelled;
  const { eta, isLoading: isEtaLoading } = useProposalEta(item.proposalId, isWaitingToExecute);
  const secondsUntilExecutable = eta ? Number(eta) - Math.floor(Date.now() / 1000) : 0;
  const timeUntilExecutable = formatDuration(secondsUntilExecutable);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/proposals?proposalId=${item.proposalId}`;
    navigator.clipboard.writeText(url);
    notifySuccess('Link copied to clipboard');
  };

  return (
    <Flex vertical>
      {flagged && (
        <Alert
          type="error"
          showIcon
          className="mb-16"
          message="Malicious proposal — not in alignment with the Autonolas DAO Constitution"
          description={
            <Flex vertical gap={8}>
              <Text>{flagged.summary}</Text>
              <div>
                <Text strong>What its calldata does:</Text>
                <ul className="m-0">
                  {flagged.actions.map((action) => (
                    <li key={action}>
                      <Text code>{action}</Text>
                    </li>
                  ))}
                </ul>
              </div>
              <Text type="secondary">
                Voting For is disabled in this interface. Against and Abstain remain available, and
                the Governor contract itself is permissionless — this flag has no effect on chain.
                Verify the calldata yourself from the transaction linked below before voting.{' '}
                <a href={DAO_CONSTITUTION_URL} target="_blank" rel="noreferrer">
                  Read the DAO Constitution {UNICODE_SYMBOLS.EXTERNAL_LINK}
                </a>
              </Text>
            </Flex>
          }
        />
      )}
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
        {isWaitingToExecute && (
          <Flex vertical>
            <Caption>Executable</Caption>
            {isEtaLoading && <Skeleton.Input active />}
            {!isEtaLoading && eta && (
              <Text>
                {getFullFormattedDate(Number(eta) * 1000)}
                {timeUntilExecutable ? ` (in ${timeUntilExecutable})` : ' (ready to execute)'}
              </Text>
            )}
            {!isEtaLoading && !eta && NA}
          </Flex>
        )}
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
      <Flex align="center" gap={8} className="mb-16">
        <Paragraph className="m-0">{item.id}</Paragraph>
        <Button size="small" icon={<LinkOutlined />} onClick={handleCopyLink}>
          Copy link
        </Button>
      </Flex>

      <Caption>Transaction</Caption>
      <a
        href={`${EXPLORER_URLS[mainnet.id]}/tx/${item.transactionHash}`}
        target="_blank"
        rel="noreferrer"
        className="mb-16"
      >
        {`${item.transactionHash} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
      </a>
    </Flex>
  );
};
