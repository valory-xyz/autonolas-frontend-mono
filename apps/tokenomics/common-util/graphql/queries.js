const { gql } = require('graphql-request');

export const balancerGetPoolQuery = (poolId) => gql`
  query GetPool {
    pool(
      id: "${poolId}"
    ) {
      tokens {
        address
        balance
      }
      totalShares
    }
  }
`;
