// utils.js transitively imports util-constants, which pulls in wagmi's ESM
// chain exports that jest is not configured to transform. The helper under
// test only depends on ethers, so stub the constant it consumes.
jest.mock('libs/util-constants/src', () => ({ VM_TYPE: { SVM: 'svm', EVM: 'evm' } }));

import { getEtherscanReadContractLink } from './utils';

describe('getEtherscanReadContractLink', () => {
  // Lower-cased input; getAddress should checksum it in the output.
  const valid = '0x52908400098527886e0f7030069857d2e4169ee7';
  const checksummed = '0x52908400098527886E0F7030069857D2E4169EE7';

  it('builds a checksummed etherscan read link for a valid address', () => {
    expect(getEtherscanReadContractLink(valid)).toBe(
      `https://etherscan.io/address/${checksummed}#readContract#F10`,
    );
  });

  it('honors a custom fragment', () => {
    expect(getEtherscanReadContractLink(valid, 'readContract#F7')).toBe(
      `https://etherscan.io/address/${checksummed}#readContract#F7`,
    );
  });

  // Security-relevant: nothing that isn't a well-formed address can ever
  // produce an href, so a javascript: payload or HTML-breakout string is
  // rejected before it could reach the DOM.
  it.each([
    null,
    undefined,
    '',
    'not-an-address',
    'javascript:alert(1)',
    `${valid}"><script>alert(1)</script>`,
  ])('returns null for invalid/malicious input: %s', (bad) => {
    expect(getEtherscanReadContractLink(bad)).toBeNull();
  });
});
