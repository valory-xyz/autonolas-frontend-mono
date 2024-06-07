import { AbiCoder, ethers } from 'ethers';

export const getNomineeHash = (account: `0x${string}`, chainId: number) => {
  const nomineeEncoded = AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'uint256'],
    [account, chainId],
  );
  return ethers.keccak256(nomineeEncoded);
};
