import type { Config } from '@wagmi/core';
import { getPublicClient } from '@wagmi/core';
import type { EstimateContractGasParameters } from 'viem';

/**
 * Estimate gas for a contract call and apply a percentage buffer to give the
 * broadcast tx headroom over the simulator's lower bound.
 *
 * Why we need this: `simulateContract` runs `eth_call`, which does NOT return
 * a gas value on the request — `request.gas` is always undefined. When the
 * subsequent `writeContract` builds the broadcast tx, it calls
 * `eth_estimateGas` internally and uses the raw lower-bound estimate as an
 * explicit `gas` field on the tx. Wallets only apply their own ~25% safety
 * buffer when `gas` is unset; with viem's explicit value, the wallet uses it
 * verbatim. The result: every write path that has non-deterministic gas (loop
 * iterations, conditional storage writes, bridge messages) sits exactly at
 * the estimator's floor and out-of-gas reverts on the slightest variance.
 *
 * Pre-migration web3.js code passed `gasLimit: estimate * 1.2` explicitly via
 * a `getEstimatedGasLimit` helper, restoring that 20% headroom.
 *
 * Usage:
 *
 *   const { request } = await simulateContract(wagmiConfig, params);
 *   const gas = await estimateGasWithBuffer(wagmiConfig, params);
 *   const hash = await writeContract(wagmiConfig, { ...request, gas });
 */
export const estimateGasWithBuffer = async (
  config: Config,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call: EstimateContractGasParameters<any> & { chainId?: number },
  multiplierPercent = 120n,
): Promise<bigint> => {
  const publicClient = getPublicClient(config, { chainId: call.chainId });
  if (!publicClient) {
    throw new Error(
      `estimateGasWithBuffer: no public client available for chainId=${call.chainId ?? 'default'}`,
    );
  }
  const estimate = await publicClient.estimateContractGas(call);
  return (estimate * multiplierPercent) / 100n;
};
