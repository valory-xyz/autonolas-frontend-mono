import { BaseError, ContractFunctionRevertedError } from 'viem';

export type DecodedRevert = { errorName: string; args?: readonly unknown[] };

export const formatRevert = ({ errorName, args = [] }: DecodedRevert) =>
  errorName === 'Error' ? String(args[0]) : `${errorName}(${args.join(', ')})`;

export const findInErrorChain = <T extends Error>(
  error: unknown,
  type: new (...args: never[]) => T,
): T | null => {
  if (!(error instanceof BaseError)) return null;
  const found = error.walk((cause) => cause instanceof type);
  return found instanceof type ? found : null;
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return 'Unknown error';
};

export const findContractRevert = (error: unknown) =>
  findInErrorChain(error, ContractFunctionRevertedError);
