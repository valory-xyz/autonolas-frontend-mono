import { BaseError, ContractFunctionRevertedError } from 'viem';

export type DecodedRevert = { errorName: string; args?: readonly unknown[] };

/** A decoded revert as one line: an `Error(string)` reads as its reason, anything else as a call. */
export const formatRevert = ({ errorName, args = [] }: DecodedRevert) =>
  errorName === 'Error' ? String(args[0]) : `${errorName}(${args.join(', ')})`;

/** The contract revert anywhere in a viem error's `cause` chain, or `null` for any other failure. */
export const findContractRevert = (error: unknown): ContractFunctionRevertedError | null => {
  if (!(error instanceof BaseError)) return null;
  const revert = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
  return revert instanceof ContractFunctionRevertedError ? revert : null;
};
