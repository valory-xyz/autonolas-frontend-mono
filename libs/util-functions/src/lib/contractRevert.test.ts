import {
  BaseError,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  encodeErrorResult,
  parseAbi,
} from 'viem';

import {
  getErrorMessage,
  findContractRevert,
  findInErrorChain,
  formatRevert,
} from './contractRevert';

const abi = parseAbi(['error WrongAmount(uint256 provided, uint256 expected)']);

const executionError = (revert: ContractFunctionRevertedError) =>
  new ContractFunctionExecutionError(revert, { abi, functionName: 'claim' });

describe('formatRevert', () => {
  it('formats a custom error as a call with its arguments', () => {
    expect(formatRevert({ errorName: 'WrongAmount', args: [BigInt(1), BigInt(0)] })).toBe(
      'WrongAmount(1, 0)',
    );
  });

  it('formats an error without arguments with empty parentheses', () => {
    expect(formatRevert({ errorName: 'Paused' })).toBe('Paused()');
  });

  it('reads an Error(string) as its reason', () => {
    expect(formatRevert({ errorName: 'Error', args: ['Paused'] })).toBe('Paused');
  });

  it('keeps the code of a Panic', () => {
    expect(formatRevert({ errorName: 'Panic', args: [BigInt(17)] })).toBe('Panic(17)');
  });
});

describe('getErrorMessage', () => {
  it("prefers viem's short message, then the error message", () => {
    expect(getErrorMessage(new BaseError('RPC request failed.'))).toBe('RPC request failed.');
    expect(getErrorMessage(new Error('plain'))).toBe('plain');
    expect(getErrorMessage('boom')).toBe('Unknown error');
  });
});

describe('findInErrorChain', () => {
  it('finds an error of the given type wrapped in a viem error', () => {
    const rejection = new UserRejectedRequestError(new Error('denied'));
    const wrapped = new ContractFunctionExecutionError(rejection, { abi, functionName: 'claim' });

    expect(findInErrorChain(wrapped, UserRejectedRequestError)).toBe(rejection);
    expect(findInErrorChain(wrapped, ContractFunctionRevertedError)).toBeNull();
    expect(findInErrorChain(new Error('plain'), UserRejectedRequestError)).toBeNull();
  });
});

describe('findContractRevert', () => {
  it('finds the decoded revert inside a contract execution error', () => {
    const data = encodeErrorResult({
      abi,
      errorName: 'WrongAmount',
      args: [BigInt(1), BigInt(0)],
    });
    const revert = new ContractFunctionRevertedError({ abi, data, functionName: 'claim' });

    const found = findContractRevert(executionError(revert));

    expect(found).toBe(revert);
    expect(found?.data && formatRevert(found.data)).toBe('WrongAmount(1, 0)');
  });

  it('ignores an error that is not a contract revert', () => {
    expect(findContractRevert(new BaseError('rpc down'))).toBeNull();
    expect(findContractRevert(new Error('rpc down'))).toBeNull();
    expect(findContractRevert('rpc down')).toBeNull();
  });
});
