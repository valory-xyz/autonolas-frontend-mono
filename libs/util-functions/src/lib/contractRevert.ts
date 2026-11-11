import { BaseError, ContractFunctionRevertedError } from 'viem';

export type DecodedRevert = { errorName: string; args?: readonly unknown[] };

/** A decoded revert as one line: an `Error(string)` reads as its reason, anything else as a call. */
export const formatRevert = ({ errorName, args = [] }: DecodedRevert) =>
  errorName === 'Error' ? String(args[0]) : `${errorName}(${args.join(', ')})`;

/** The first error of `type` in a viem error's `cause` chain, or `null`. */
export const findInChain = <T extends Error>(
  error: unknown,
  type: new (...args: never[]) => T,
): T | null => {
  if (!(error instanceof BaseError)) return null;
  const found = error.walk((cause) => cause instanceof type);
  return found instanceof type ? found : null;
};

/** A failure as one line: viem's `shortMessage`, else the error's message. */
export const errorMessage = (error: unknown) => {
  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
};

/** The contract revert anywhere in a viem error's `cause` chain, or `null` for any other failure. */
export const findContractRevert = (error: unknown) =>
  findInChain(error, ContractFunctionRevertedError);
