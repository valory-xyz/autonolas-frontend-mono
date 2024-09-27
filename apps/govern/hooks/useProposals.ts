import { useQuery } from '@tanstack/react-query';
import { readContracts } from '@wagmi/core';
import { useMemo } from 'react';
import { Abi, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useBlock } from 'wagmi';

import { GOVERNOR_OLAS } from 'libs/util-contracts/src/lib/abiAndAddresses';
import { areAddressesEqual } from 'libs/util-functions/src';

import { wagmiConfig } from 'common-util/config/wagmi';
import { getProposals } from 'common-util/graphql/queries';
import { useAppSelector } from 'store/index';

export const useProposals = () => {
  const { data: block, isLoading: isBlockLoading } = useBlock();
  const { proposalVotes } = useAppSelector((state) => state.govern);

  const { data: proposals, isLoading: isProposalsLoading } = useQuery({
    enabled: block !== undefined,
    queryKey: ['getProposals'],
    queryFn: async () => {
      const proposals = await getProposals();
      // Check if there are proposals with empty quorum (e.g. created or ongoing)
      const quorumArgs: { proposalId: string; block: bigint }[] = [];
      proposals.proposalCreateds.forEach((item) => {
        if (!item.quorum) {
          const startBlock = BigInt(item.startBlock);
          quorumArgs.push({
            proposalId: item.proposalId,
            // quorum value depends on the amount of veOLAS,
            // which may vary in different blocks.
            // If the proposals has not started yet, get approximate value at current block
            block: block && block.number < startBlock ? block.number : startBlock,
          });
        }
      });

      if (quorumArgs.length > 0) {
        // retrieve quorums from on-chain
        const quorums = await readContracts(wagmiConfig, {
          contracts: quorumArgs.map((item) => ({
            abi: GOVERNOR_OLAS.abi as Abi,
            address: (GOVERNOR_OLAS.addresses as Record<number, Address>)[mainnet.id],
            chainId: mainnet.id,
            functionName: 'quorum',
            args: [item.block],
          })),
        });

        // put in an object for convenient search
        const quorumByProposalId = quorums.reduce<Record<string, string>>(
          (res, quorumRes, index) => {
            if (quorumRes.result) {
              res[quorumArgs[index].proposalId] = quorumRes.result as string;
            }
            return res;
          },
          {},
        );

        // update the result with quorums
        return proposals.proposalCreateds.map((item) => ({
          ...item,
          quorum: item.quorum || quorumByProposalId[item.proposalId],
        }));
      }

      return proposals.proposalCreateds;
    },
  });

  const data = useMemo(() => {
    if (!proposals) return [];
    if (Object.values(proposalVotes).length === 0) return proposals;
    return proposals.map((proposal) => ({
      ...proposal,
      voteCasts: [
        // insert fresh vote on top of the votes from subgraph
        // if not there already
        ...(proposalVotes[proposal.proposalId] &&
        proposal.voteCasts.some((vote) =>
          areAddressesEqual(vote.voter, proposalVotes[proposal.proposalId].voter),
        )
          ? []
          : [proposalVotes[proposal.proposalId]]),
        ...proposal.voteCasts,
      ],
    }));
  }, [proposals, proposalVotes]);

  return { data, block, isLoading: isBlockLoading || isProposalsLoading };
};
