import {
  BaseError,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  encodeErrorResult,
  parseAbi,
} from 'viem';

import { findContractRevert, formatRevert } from './contractRevert';

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
