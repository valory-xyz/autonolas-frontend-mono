import type { Address } from 'viem';
import { cloneDeep } from 'lodash';

import type { StakingContract } from 'types';

import type { ClaimBatch } from './staking-incentives-claim';

const MAX_BATCH_SIZE = 10;

/**
 * How the claim cursors moved since the shown list was built:
 * - `none`: not at all, so the list is unchanged;
 * - `own-claims`: only as this user's recorded claims explain, so the list re-indexes;
 * - `concurrent`: past what those claims explain (someone else claimed meanwhile), or with no
 *   earlier cursors to compare against.
 */
export type CursorChange = 'none' | 'own-claims' | 'concurrent';

export type ClaimableBatchesRefresh = { batches: ClaimBatch[]; change: CursorChange };

/** A number per staking contract; a contract that was not read has none. */
export type ByAddress = Partial<Record<Address, number>>;
export type Cursors = ByAddress;

export const READ_TARGET = { claimCursor: 'claim cursor', voteWeight: 'vote weight' } as const;
type ReadTarget = (typeof READ_TARGET)[keyof typeof READ_TARGET];

export const readFailure = (what: ReadTarget, address: Address, cause?: unknown) =>
  new Error(`Could not read the ${what} of staking contract ${address}`, { cause });

/**
 * Cursors moved on by this user's own confirmed claims. A read can lag those claims, and a list
 * built from it alone would offer an epoch they already took.
 */
export function getExpectedCursors(
  built: Record<Address, number>,
  ownClaimedThrough: Cursors,
): Record<Address, number>;
export function getExpectedCursors(
  built: Record<Address, number> | null,
  ownClaimedThrough: Cursors,
): Record<Address, number> | null;
export function getExpectedCursors(
  built: Record<Address, number> | null,
  ownClaimedThrough: Cursors,
): Record<Address, number> | null {
  if (!built) return null;
  return Object.fromEntries(
    Object.entries(built).map(([address, cursor]) => [
      address,
      Math.max(cursor, ownClaimedThrough[address as Address] ?? cursor),
    ]),
  );
}

/**
 * The cursors a confirmed claim of `batch` moves its targets to: one epoch past what was expected.
 * A target with no expected cursor is left out, so the next refresh reads its move as concurrent.
 */
export const getClaimedThrough = (expected: Cursors, [, stakingTargets]: ClaimBatch): Cursors => {
  const claimedThrough: Cursors = {};
  stakingTargets.flat().forEach((address) => {
    const cursor = expected[address];
    if (cursor !== undefined) claimedThrough[address] = cursor + 1;
  });
  return claimedThrough;
};

export const getCursorChange = (
  built: Cursors | null,
  expected: Cursors | null,
  fresh: Record<Address, number>,
): CursorChange => {
  if (!built || !expected) return 'concurrent';
  const addresses = Object.keys(fresh) as Address[];
  // A cursor only moves forward: one below what own claims explain is a lagging read, not a claim.
  const movedByOthers = addresses.some((address) => {
    const expectedCursor = expected[address];
    return expectedCursor === undefined || fresh[address] > expectedCursor;
  });
  if (movedByOthers) return 'concurrent';
  return addresses.some((address) => fresh[address] !== built[address]) ? 'own-claims' : 'none';
};

/**
 * Assuming max batch size to be "3"
 * nomineesTimesToClaimArray: [[0x1, 1], [0x2, 1], [0x3, 2], [0x4, 1]]
 *
 * returns:
 * [
 *  [0x1, 0x2, 0x3],
 *  [0x3, 0x4],
 * ]
 */
const chunkNomineesArrayByTimeToClaim = (
  nomineesTimesToClaimArray: [Address, number][],
  chunkSize: number = MAX_BATCH_SIZE,
) => {
  const chunks: Address[][] = [];
  let filteredNomineesTimesToClaim = cloneDeep(nomineesTimesToClaimArray);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentChunk: Address[] = [];
    let index = 0;

    for (index = 0; index < Math.min(chunkSize, filteredNomineesTimesToClaim.length); index++) {
      const nominee = filteredNomineesTimesToClaim[index][0];
      currentChunk.push(nominee);
      /* Decrease time to claim by 1 each time the nominee gets into the currentChunk, this ensures 
      the order as well as the times a nominee needs to be claimed works as expected */
      filteredNomineesTimesToClaim[index][1] -= 1;
    }

    chunks.push(currentChunk);
    filteredNomineesTimesToClaim = filteredNomineesTimesToClaim.filter(
      ([, timesToClaim]) => timesToClaim > 0,
    );

    if (filteredNomineesTimesToClaim.length === 0) {
      break;
    }
  }

  return chunks;
};

const requireEntry = (map: ByAddress, address: Address, what: ReadTarget, cause?: unknown) => {
  const value = map[address];
  if (value === undefined) throw readFailure(what, address, cause);
  return value;
};

type BuildClaimBatchesParams = {
  nominees: StakingContract[];
  lastClaimedEpochs: Cursors;
  currentEpoch: number;
  minStakingWeight: number;
  /**
   * Relative weight per nominee address at the previous epoch's end, in percent × 100: the same
   * unit as `minStakingWeight`.
   */
  relativeWeights: ByAddress;
  /** Why a nominee's weight read failed, given as the cause of its missing-weight error. */
  weightReadErrors?: Partial<Record<Address, unknown>>;
};

export const buildClaimBatches = ({
  nominees,
  lastClaimedEpochs,
  currentEpoch,
  minStakingWeight,
  relativeWeights,
  weightReadErrors = {},
}: BuildClaimBatchesParams): ClaimBatch[] => {
  const filteredNominees = nominees.filter((nominee) => {
    const nomineeRelativeWeight = requireEntry(
      relativeWeights,
      nominee.address,
      READ_TARGET.voteWeight,
      weightReadErrors[nominee.address],
    );
    const lastClaimedStakingEpoch = requireEntry(
      lastClaimedEpochs,
      nominee.address,
      READ_TARGET.claimCursor,
    );

    return nomineeRelativeWeight >= minStakingWeight && lastClaimedStakingEpoch < currentEpoch;
  });

  const nomineesByChain = filteredNominees.reduce(
    (acc, nominee) => {
      acc[nominee.chainId] = [...(acc[nominee.chainId] || []), nominee.address];
      return acc;
    },
    {} as Record<number, Address[]>,
  );

  const sortedNomineesByChain = Object.keys(nomineesByChain).reduce(
    (acc, chainId) => {
      acc[Number(chainId)] = nomineesByChain[Number(chainId)].sort((a, b) =>
        a.toString().localeCompare(b.toString()),
      );
      return acc;
    },
    {} as Record<number, Address[]>,
  );

  /**
   * Chunk the nominees array into smaller arrays of max size `MAX_BATCH_SIZE`
   * eg:
   * {
   *  1: [
   *    [0x1, 0x2, 0x3],
   *    [0x4, 0x5, 0x6],
   *    [0x7, 0x8, 0x9],
   *    [0x10, 0x11, 0x12],
   *  ],
   *  2: [
   *    [0x13, 0x14, 0x15],
   *    [0x16, 0x17, 0x18],
   *    [0x19, 0x20, 0x21],
   *    [0x22, 0x23, 0x24],
   *  ],
   * }
   */
  const batchesByChain = Object.keys(sortedNomineesByChain).reduce(
    (acc, chainId) => {
      const nominees = sortedNomineesByChain[Number(chainId)];

      /**
       * Nominees along with their timesToClaim
       * eg: [[0x1, 1], [0x2, 1], [0x3, 2], [0x4, 1]]
       */
      const nomineesTimesToClaimArray = nominees.reduce(
        (acc, nominee) => {
          const lastClaimedStakingEpoch = requireEntry(
            lastClaimedEpochs,
            nominee,
            READ_TARGET.claimCursor,
          );
          acc.push([nominee, currentEpoch - lastClaimedStakingEpoch]);
          return acc;
        },
        [] as [Address, number][],
      );
      const chunks = chunkNomineesArrayByTimeToClaim(nomineesTimesToClaimArray, MAX_BATCH_SIZE);
      acc[Number(chainId)] = chunks;
      return acc;
    },
    {} as Record<number, Address[][]>,
  );

  const sortedChainIds = Object.keys(batchesByChain).sort((a, b) => Number(a) - Number(b));

  /**
   * Create batches of nominees to claim
   * eg:
   * [
   *    [[1, 2], [[0x1, 0x2, 0x3], [0x13, 0x14, 0x15]]],
   *    [[1, 2], [[0x4, 0x5, 0x6], [0x16, 0x17, 0x18]]],
   * ]
   * The max size of the second element of the subarray would be determined by the `MAX_BATCH_SIZE`
   */
  let batchIndex = 0;
  const batches: ClaimBatch[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const currentBatchChainIds: number[] = [];
    const currentBatchNominees: Address[][] = [];

    sortedChainIds.forEach((chainId) => {
      const nomineesByChainAtIndex = batchesByChain[Number(chainId)]?.[batchIndex] || [];
      if (nomineesByChainAtIndex.length !== 0) {
        currentBatchChainIds.push(Number(chainId));
        currentBatchNominees.push(nomineesByChainAtIndex);
      }
    });

    batchIndex++;
    if (currentBatchNominees.length === 0) {
      break;
    }

    batches.push([currentBatchChainIds, currentBatchNominees]);
  }

  return batches;
};
