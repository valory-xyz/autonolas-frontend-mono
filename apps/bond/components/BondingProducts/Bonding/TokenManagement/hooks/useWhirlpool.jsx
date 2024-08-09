import { BN } from '@coral-xyz/anchor';
import {
  PoolUtil,
  PriceMath,
  WhirlpoolContext,
  buildWhirlpoolClient,
} from '@orca-so/whirlpools-sdk';
import { GraphQLClient, gql } from 'graphql-request';
import { useCallback } from 'react';

import { VM_TYPE, areAddressesEqual } from '@autonolas/frontend-library';

import { ADDRESSES } from 'common-util/constants/addresses';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';

import { getSvmCalculatedPriceLp } from '../../BondingList/utils';
import { ORCA, WHIRLPOOL } from '../constants';

const whirlpoolQuery = async () => {
  const SHYFT_API_KEY = process.env.NEXT_PUBLIC_SHYFT_API_KEY;
  if (!SHYFT_API_KEY) {
    if (process.env.NODE_ENV === 'development') {
      console.error('SHYFT_API_KEY is not available');
      return {};
    }
    if (process.env.NODE_ENV === 'production') throw new Error('SHYFT_API_KEY is not available');
  }

  const endpoint = `https://programs.shyft.to/v0/graphql/?api_key=${SHYFT_API_KEY}`;
  const graphQLClient = new GraphQLClient(endpoint, {
    method: 'POST',
    jsonSerializer: { parse: JSON.parse, stringify: JSON.stringify },
  });

  // Can build queries using Hasura: https://docs.shyft.to/solana-indexers/instant-graphql-apis/getting-started
  const query = gql`
    query FindNonZeroLiqPositionQuery(
      $where: ORCA_WHIRLPOOLS_position_bool_exp
      $orderBy: [ORCA_WHIRLPOOLS_position_order_by!]
      $limit: Int
      $offset: Int
    ) {
      ORCA_WHIRLPOOLS_position(limit: $limit, offset: $offset, order_by: $orderBy, where: $where) {
        _lamports
        feeGrowthCheckpointA
        feeGrowthCheckpointB
        feeOwedA
        feeOwedB
        liquidity
        positionMint
        tickLowerIndex
        tickUpperIndex
        whirlpool
        pubkey
        liquidity
      }
    }
  `;

  const variables = {
    where: {
      liquidity: { _gt: '0' },
      whirlpool: { _eq: WHIRLPOOL.toString() },
    },
    orderBy: { liquidity: 'desc' },
  };

  const result = (await graphQLClient.request(query, variables)).ORCA_WHIRLPOOLS_position;

  const filteredPositions = result.filter(
    (e) => e.tickLowerIndex === -443584 && e.tickUpperIndex === 443584 && e.liquidity > 0,
  );

  return filteredPositions;
};

/**
 * Hook to get the data from the whirlpool
 */
export const useWhirlpool = () => {
  const { nodeProvider } = useSvmConnectivity();

  const getWhirlpoolData = useCallback(async () => {
    const whirlpoolCtx = WhirlpoolContext.withProvider(nodeProvider, ORCA);
    const client = buildWhirlpoolClient(whirlpoolCtx);
    const whirlpoolClient = await client.getPool(WHIRLPOOL);

    const whirlpoolData = whirlpoolClient.getData();
    const whirlpoolTokenA = whirlpoolClient.getTokenAInfo();
    const whirlpoolTokenB = whirlpoolClient.getTokenBInfo();

    return { whirlpoolData, whirlpoolTokenA, whirlpoolTokenB };
  }, [nodeProvider]);

  return { getWhirlpoolData };
};

export const useWhirlPoolInformation = () => {
  const { getWhirlpoolData } = useWhirlpool();

  return useCallback(async () => {
    const positions = await whirlpoolQuery();

    if (!positions) return null;

    let whirlpoolData;
    let whirlpoolTokenA;

    const fetchWhirlpoolDataWithRetry = async () => {
      try {
        const data = await getWhirlpoolData();

        if (data) {
          whirlpoolData = data.whirlpoolData;
          whirlpoolTokenA = data.whirlpoolTokenA;
        }

        if (!whirlpoolData || !whirlpoolTokenA) {
          /* eslint-disable-next-line no-console */
          console.log('Invalid whirlpool data, retrying in 2 seconds');
          setTimeout(fetchWhirlpoolDataWithRetry, 2000);
        }
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.warn('Error fetching whirlpool data, retrying in 2 seconds');
        setTimeout(fetchWhirlpoolDataWithRetry, 2000);
      }
    };

    await fetchWhirlpoolDataWithRetry();

    let reserveToken0 = new BN(0);
    let reserveToken1 = new BN(0);
    let totalSupply = new BN(0);

    positions.forEach((position) => {
      const amounts = PoolUtil.getTokenAmountsFromLiquidity(
        position.liquidity,
        whirlpoolData.sqrtPrice,
        PriceMath.tickIndexToSqrtPriceX64(position.tickLowerIndex),
        PriceMath.tickIndexToSqrtPriceX64(position.tickUpperIndex),
        false,
      );

      reserveToken0 = reserveToken0.add(amounts.tokenA);
      reserveToken1 = reserveToken1.add(amounts.tokenB);
      totalSupply = totalSupply.add(new BN(position.liquidity));
    });

    const address1 = whirlpoolTokenA.mint.toString();
    const address2 = ADDRESSES[VM_TYPE.SVM].olasAddress;

    const reserveOlas = areAddressesEqual(address1, address2)
      ? reserveToken0.toString()
      : reserveToken1.toString();

    const svmPriceLp = getSvmCalculatedPriceLp(reserveOlas, totalSupply.toString());
    return svmPriceLp;
  }, [getWhirlpoolData]);
};
