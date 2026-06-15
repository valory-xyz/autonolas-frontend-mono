import { ethers } from 'ethers-v5';

/**
 * GPL-free reimplementations of the three `@gnosis.pm/safe-contracts` helpers the
 * marketplace multisig flow used (`buildSafeTransaction`, `encodeMultiSend`,
 * `buildMultiSendSafeTx`). They implement the on-chain Safe MultiSend encoding
 * (defined by `MultiSend.sol`: operation ++ to ++ value ++ dataLength ++ data),
 * so the bytes are identical to the originals — proven byte-for-byte against the
 * real package in `tests/common-util/functions/safeTransactions.test.js`.
 *
 * Replaced `@gnosis.pm/safe-contracts` (GPL-3.0), whose `dist/` JS shipped into
 * the marketplace bundle. Uses `ethers-v5` to match the version safe-contracts
 * used internally and the version this multisig flow already runs on.
 */

const { AddressZero } = ethers.constants;

/** Fill a Safe transaction template with the Safe contract's zero-defaults. */
export const buildSafeTransaction = (template) => ({
  to: template.to,
  value: template.value || 0,
  data: template.data || '0x',
  operation: template.operation || 0,
  safeTxGas: template.safeTxGas || 0,
  baseGas: template.baseGas || 0,
  gasPrice: template.gasPrice || 0,
  gasToken: template.gasToken || AddressZero,
  refundReceiver: template.refundReceiver || AddressZero,
  nonce: template.nonce,
});

/** Pack a single tx per the MultiSend.sol layout (without the leading 0x). */
const encodeMetaTransaction = (tx) => {
  const data = ethers.utils.arrayify(tx.data);
  return ethers.utils
    .solidityPack(
      ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
      [tx.operation, tx.to, tx.value, data.length, data],
    )
    .slice(2);
};

/** Concatenate packed meta-transactions into the MultiSend `transactions` blob. */
export const encodeMultiSend = (txs) => `0x${txs.map((tx) => encodeMetaTransaction(tx)).join('')}`;

/**
 * Wrap a batch of txs into a single Safe transaction that delegatecalls the
 * MultiSend contract. `multiSend` is an ethers Contract (or any object exposing
 * `.address` and `.interface.encodeFunctionData`).
 */
export const buildMultiSendSafeTx = (multiSend, txs, nonce, overrides) => {
  const data = multiSend.interface.encodeFunctionData('multiSend', [encodeMultiSend(txs)]);
  return buildSafeTransaction({
    to: multiSend.address,
    data,
    operation: 1, // delegateCall
    nonce,
    ...overrides,
  });
};

/**
 * Build the Safe MultiSend transaction that adds the service's agent instances as
 * owners and removes the service owner — the deterministic core of `onMultisigSubmit`.
 * Kept here (a heavy-import-free module) so it can be characterization-tested without
 * loading the wallet/wagmi graph in `utils.jsx`.
 *
 * @param multisigInterface ethers Interface of the GnosisSafe (for encoding owner ops)
 * @param multiSendContract object exposing `.address` and `.interface` (MultiSend)
 */
export const buildMultisigUpdateSafeTx = ({
  multisigInterface,
  multiSendContract,
  multisig,
  agentInstances,
  serviceOwner,
  threshold,
  nonce,
}) => {
  // Add each agent instance as an owner, keeping the threshold the same.
  const txs = agentInstances.map((agentInstance) =>
    buildSafeTransaction({
      to: multisig,
      data: multisigInterface.encodeFunctionData('addOwnerWithThreshold', [agentInstance, 1]),
      nonce: 0,
    }),
  );

  // Remove the original (service owner) owner.
  txs.push(
    buildSafeTransaction({
      to: multisig,
      data: multisigInterface.encodeFunctionData('removeOwner', [
        agentInstances[0],
        serviceOwner,
        threshold,
      ]),
      nonce: 0,
    }),
  );

  return buildMultiSendSafeTx(multiSendContract, txs, nonce);
};
