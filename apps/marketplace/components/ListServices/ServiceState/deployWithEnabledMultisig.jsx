import { getEnabledMultisigs } from '../utils';
import { onStep3Deploy } from './utils';

export const DEPLOY_REFUSAL = Object.freeze({
  RECHECK_FAILED: 'recheck-failed',
  CHAIN_CHANGED: 'chain-changed',
  NOT_ENABLED: 'not-enabled',
});

/** The deploy was not sent; `enabled` is the re-checked list when it was read. */
export class DeployRefusedError extends Error {
  constructor(reason, { enabled, cause } = {}) {
    super(`Deploy refused: ${reason}`, { cause });
    this.name = 'DeployRefusedError';
    this.reason = reason;
    this.enabled = enabled;
  }
}

/**
 * Deploys only through a wrapper `ServiceRegistry.mapMultisigs` still enables, since it may have
 * been disabled after the options were loaded, and only on the chain the submit started on.
 * Resolves to the re-checked list of enabled wrappers.
 */
export const deployWithEnabledMultisig = async ({
  account,
  serviceId,
  multisig,
  payload,
  chainId,
  getCurrentChainId,
}) => {
  let enabled;
  try {
    enabled = await getEnabledMultisigs(chainId);
  } catch (error) {
    throw new DeployRefusedError(DEPLOY_REFUSAL.RECHECK_FAILED, {
      cause: error,
    });
  }
  if (getCurrentChainId() !== chainId) {
    throw new DeployRefusedError(DEPLOY_REFUSAL.CHAIN_CHANGED);
  }
  if (!enabled.includes(multisig)) {
    throw new DeployRefusedError(DEPLOY_REFUSAL.NOT_ENABLED, { enabled });
  }
  await onStep3Deploy(account, serviceId, multisig, payload);
  return enabled;
};
