import {
  DEPLOY_REFUSAL,
  DeployRefusedError,
  deployWithEnabledMultisig,
} from '../../../components/ListServices/ServiceState/deployWithEnabledMultisig';
import { onStep3Deploy } from '../../../components/ListServices/ServiceState/utils';
import { getEnabledMultisigs } from '../../../components/ListServices/utils';

jest.mock('../../../components/ListServices/utils', () => ({
  getEnabledMultisigs: jest.fn(),
}));
jest.mock('../../../components/ListServices/ServiceState/utils', () => ({
  onStep3Deploy: jest.fn(),
}));

const GNOSIS = 100;
const A = '0x00000000000000000000000000000000000000a1';
const B = '0x00000000000000000000000000000000000000b2';

const deploy = (overrides = {}) =>
  deployWithEnabledMultisig({
    account: '0xowner',
    serviceId: '1',
    multisig: A,
    payload: '0xpayload',
    chainId: GNOSIS,
    getCurrentChainId: () => GNOSIS,
    ...overrides,
  });

const refusal = (promise) =>
  promise.then(
    () => null,
    (error) => error,
  );

describe('deployWithEnabledMultisig', () => {
  beforeEach(() => jest.resetAllMocks());

  it('deploys through a wrapper that is still enabled, and returns the re-checked list', async () => {
    getEnabledMultisigs.mockResolvedValue([A, B]);

    await expect(deploy()).resolves.toEqual([A, B]);

    expect(getEnabledMultisigs).toHaveBeenCalledWith(GNOSIS);
    expect(onStep3Deploy).toHaveBeenCalledWith('0xowner', '1', A, '0xpayload');
  });

  it('refuses a wrapper disabled since the options loaded, with the re-checked list', async () => {
    getEnabledMultisigs.mockResolvedValue([B]);

    const error = await refusal(deploy());

    expect(error).toBeInstanceOf(DeployRefusedError);

    expect(error.reason).toBe(DEPLOY_REFUSAL.NOT_ENABLED);
    expect(error.enabled).toEqual([B]);
    expect(onStep3Deploy).not.toHaveBeenCalled();
  });

  it('refuses when the re-check cannot be read, keeping its cause', async () => {
    const readError = new Error('rpc down');
    getEnabledMultisigs.mockRejectedValue(readError);

    const error = await refusal(deploy());

    expect(error).toBeInstanceOf(DeployRefusedError);

    expect(error.reason).toBe(DEPLOY_REFUSAL.RECHECK_FAILED);
    expect(error.cause).toBe(readError);
    expect(onStep3Deploy).not.toHaveBeenCalled();
  });

  it('refuses when the chain changed during the re-check', async () => {
    getEnabledMultisigs.mockResolvedValue([A]);

    const error = await refusal(deploy({ getCurrentChainId: () => 10 }));

    expect(error).toBeInstanceOf(DeployRefusedError);

    expect(error.reason).toBe(DEPLOY_REFUSAL.CHAIN_CHANGED);
    expect(onStep3Deploy).not.toHaveBeenCalled();
  });

  it('passes a deploy failure through as is', async () => {
    const deployError = new Error('reverted');
    getEnabledMultisigs.mockResolvedValue([A]);
    onStep3Deploy.mockRejectedValue(deployError);

    await expect(deploy()).rejects.toBe(deployError);
  });
});
