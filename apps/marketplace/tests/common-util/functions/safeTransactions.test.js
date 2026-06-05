import { ethers } from 'ethers-v5';

import { GNOSIS_SAFE_CONTRACT, MULTI_SEND_CONTRACT } from 'common-util/AbiAndAddresses';
import {
  buildMultiSendSafeTx,
  buildMultisigUpdateSafeTx,
  buildSafeTransaction,
  encodeMultiSend,
} from 'common-util/functions/safeTransactions';

const { AddressZero } = ethers.constants;

// MultiSendCallOnly address used when the golden values were captured.
const MULTISEND_ADDR = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2';
const MULTISIG = '0x1234567890123456789012345678901234567890';
const multiSend = {
  address: MULTISEND_ADDR,
  interface: new ethers.utils.Interface(['function multiSend(bytes transactions) payable']),
};

const CALLDATAS = [
  '0x0d582f13000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0000000000000000000000000000000000000000000000000000000000000001',
  '0x0d582f13000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0000000000000000000000000000000000000000000000000000000000000001',
  '0xe009cfde000000000000000000000000cccccccccccccccccccccccccccccccccccccccc000000000000000000000000dddddddddddddddddddddddddddddddddddddddd0000000000000000000000000000000000000000000000000000000000000002',
];

// Golden value captured from @gnosis.pm/safe-contracts@1.3.0 (the GPL-3.0 package
// this module replaces) via a one-time equivalence check, proving byte-identical
// output. If this ever fails, the reimplementation has drifted from the original.
const GOLDEN_ENCODE_MULTISEND =
  '0x001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000440d582f13000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0000000000000000000000000000000000000000000000000000000000000001001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000440d582f13000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb000000000000000000000000000000000000000000000000000000000000000100123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064e009cfde000000000000000000000000cccccccccccccccccccccccccccccccccccccccc000000000000000000000000dddddddddddddddddddddddddddddddddddddddd0000000000000000000000000000000000000000000000000000000000000002';

describe('safeTransactions (GPL-free Safe MultiSend helpers)', () => {
  const txs = CALLDATAS.map((data) => buildSafeTransaction({ to: MULTISIG, data, nonce: 0 }));

  it('buildSafeTransaction fills the exact Safe-tx zero-defaults', () => {
    expect(buildSafeTransaction({ to: MULTISIG, data: CALLDATAS[0], nonce: 0 })).toEqual({
      to: MULTISIG,
      value: 0,
      data: CALLDATAS[0],
      operation: 0,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: AddressZero,
      refundReceiver: AddressZero,
      nonce: 0,
    });
  });

  it('encodeMultiSend matches @gnosis.pm/safe-contracts byte-for-byte (golden)', () => {
    expect(encodeMultiSend(txs)).toBe(GOLDEN_ENCODE_MULTISEND);
  });

  it('buildMultiSendSafeTx wraps the batch as a delegatecall Safe tx', () => {
    expect(buildMultiSendSafeTx(multiSend, txs, 7)).toEqual({
      to: MULTISEND_ADDR,
      value: 0,
      data: multiSend.interface.encodeFunctionData('multiSend', [GOLDEN_ENCODE_MULTISEND]),
      operation: 1,
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      gasToken: AddressZero,
      refundReceiver: AddressZero,
      nonce: 7,
    });
  });

  it('encodeMetaTransaction packs empty data with a zero length word', () => {
    // Hand-verifiable: op(00) ++ to(20B) ++ value(32B zero) ++ dataLen(32B zero) ++ no data.
    const to = `0x${'11'.repeat(20)}`;
    expect(encodeMultiSend([buildSafeTransaction({ to, data: '0x', nonce: 0 })])).toBe(
      `0x00${'11'.repeat(20)}${'00'.repeat(32)}${'00'.repeat(32)}`,
    );
  });
});

// Characterization test for the actual consuming code path (onMultisigSubmit's
// tx-building), using the REAL GnosisSafe + MultiSend ABIs. The golden safeTx was
// captured by running the identical sequence through @gnosis.pm/safe-contracts@1.3.0
// — so this proves the wiring + ABIs + helpers together reproduce the old behaviour.
describe('buildMultisigUpdateSafeTx — characterization vs @gnosis.pm/safe-contracts', () => {
  const multisig = MULTISIG;
  const agentInstances = [`0x${'aa'.repeat(20)}`, `0x${'bb'.repeat(20)}`];
  const serviceOwner = `0x${'cc'.repeat(20)}`;
  const threshold = 1;
  const nonce = 5;

  const multisigInterface = new ethers.utils.Interface(GNOSIS_SAFE_CONTRACT.abi);
  const multiSendContract = {
    address: MULTISEND_ADDR,
    interface: new ethers.utils.Interface(MULTI_SEND_CONTRACT.abi),
  };

  // Golden safeTx captured from the OLD @gnosis.pm/safe-contracts@1.3.0 path with the
  // same fixed inputs (2 agent instances → addOwnerWithThreshold ×2 + removeOwner).
  const GOLDEN_SAFE_TX = {
    to: MULTISEND_ADDR,
    value: 0,
    data: '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001eb001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000440d582f13000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0000000000000000000000000000000000000000000000000000000000000001001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000440d582f13000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb000000000000000000000000000000000000000000000000000000000000000100123456789012345678901234567890123456789000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064f8dc5dd9000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa000000000000000000000000cccccccccccccccccccccccccccccccccccccccc0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000',
    operation: 1,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: AddressZero,
    refundReceiver: AddressZero,
    nonce: 5,
  };

  it('reproduces the exact safeTx the old safe-contracts path produced', () => {
    expect(
      buildMultisigUpdateSafeTx({
        multisigInterface,
        multiSendContract,
        multisig,
        agentInstances,
        serviceOwner,
        threshold,
        nonce,
      }),
    ).toEqual(GOLDEN_SAFE_TX);
  });
});
