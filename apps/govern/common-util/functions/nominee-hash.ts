import { AbiCoder, ethers } from 'ethers';

import { Address } from 'types/index';

export const getNomineeHash = (account: Address, chainId: number) => {
  const nomineeEncoded = AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256'],
    [account, chainId],
  );
  return ethers.keccak256(nomineeEncoded);
};
