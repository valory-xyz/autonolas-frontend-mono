import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  encodeErrorResult,
  getAddress,
} from 'viem';

import { notifyError, notifySuccess } from 'libs/util-functions/src';
import { SERVICE_MANAGER_TOKEN_CONTRACT } from 'common-util/AbiAndAddresses';
import { useHelpers } from 'common-util/hooks';

import { FinishedRegistration } from '../../../components/ListServices/ServiceState/3rdStepFinishedRegistration';
import { onStep3Deploy } from '../../../components/ListServices/ServiceState/utils';
import { getEnabledMultisigs } from '../../../components/ListServices/utils';

jest.mock('libs/util-functions/src', () => ({
  ...jest.requireActual('libs/util-functions/src/lib/contractRevert'),
  notifyError: jest.fn(),
  notifySuccess: jest.fn(),
}));
jest.mock('common-util/hooks', () => ({ useHelpers: jest.fn() }));
jest.mock('common-util/functions', () => ({
  isValidSolanaPublicKey: jest.fn(),
  notifyWrongNetwork: jest.fn(),
}));
jest.mock('../../../components/ListServices/utils', () => ({ getEnabledMultisigs: jest.fn() }));
jest.mock('../../../components/ListServices/ServiceState/utils', () => ({
  onStep3Deploy: jest.fn(),
}));
jest.mock('../../../components/ListServices/ServiceState/useSvmServiceStateManagement', () => ({
  useFinishRegistration: jest.fn(),
}));

const GNOSIS = 100;
const OPTIMISM = 10;
const A = '0x00000000000000000000000000000000000000a1';
const B = '0x00000000000000000000000000000000000000b2';

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderStep = (chainId) => {
  useHelpers.mockReturnValue({ account: '0xowner', chainId, isSvm: false });
  const props = {
    isOwner: true,
    serviceId: '1',
    multisig: '0x0000000000000000000000000000000000000000',
    handleTerminate: jest.fn(),
    getOtherBtnProps: () => ({}),
    getButton: (button) => button,
    updateDetails: jest.fn(),
  };
  const view = render(<FinishedRegistration {...props} />);
  const switchChain = (nextChainId) => {
    useHelpers.mockReturnValue({ account: '0xowner', chainId: nextChainId, isSvm: false });
    view.rerender(<FinishedRegistration {...props} />);
  };
  return { props, switchChain };
};

const { abi } = SERVICE_MANAGER_TOKEN_CONTRACT;
// What wagmi throws for a reverted deploy: the decoded revert wrapped in an execution error.
const deployError = (data) =>
  new ContractFunctionExecutionError(
    new ContractFunctionRevertedError({ abi, data, functionName: 'deploy' }),
    { abi, functionName: 'deploy', args: [] },
  );

const selectWrapper = async (address) => {
  fireEvent.click(await screen.findByRole('radio', { name: address }));
  return screen.findByRole('button', { name: 'Submit' });
};

describe('FinishedRegistration multisig picker', () => {
  beforeEach(() => {
    // Not resetAllMocks: that would also reset jest.setup's window.matchMedia mock, which antd needs.
    [getEnabledMultisigs, onStep3Deploy, notifyError, notifySuccess, useHelpers].forEach((mock) =>
      mock.mockReset(),
    );
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('clears the selection on a chain change and ignores the previous chain late answer', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]);
    const { switchChain } = renderStep(GNOSIS);
    await selectWrapper(A);

    const staleOptimism = deferred();
    const freshGnosis = deferred();
    getEnabledMultisigs
      .mockReturnValueOnce(staleOptimism.promise)
      .mockReturnValueOnce(freshGnosis.promise);
    switchChain(OPTIMISM);
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: A })).not.toBeInTheDocument();
    switchChain(GNOSIS);

    await act(async () => freshGnosis.resolve([B]));
    await act(async () => staleOptimism.resolve([A]));

    expect(screen.getByRole('radio', { name: B })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: A })).not.toBeInTheDocument();
  });

  it('clears the selection when the new chain enables the same wrapper address', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([A]);
    const { switchChain } = renderStep(GNOSIS);
    await selectWrapper(A);

    switchChain(OPTIMISM);

    expect(await screen.findByRole('radio', { name: A })).not.toBeChecked();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('does not deploy through a wrapper disabled since the options loaded', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([]);
    renderStep(GNOSIS);
    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'The selected multisig option is no longer enabled. Please choose another.',
      ),
    );
    expect(onStep3Deploy).not.toHaveBeenCalled();
  });

  it('deploys once when Submit is pressed twice during the enabled check', async () => {
    const check = deferred();
    getEnabledMultisigs.mockResolvedValue([A]);
    onStep3Deploy.mockResolvedValue(undefined);
    renderStep(GNOSIS);
    const submit = await selectWrapper(A);
    getEnabledMultisigs.mockReturnValueOnce(check.promise);
    const checksBeforeSubmit = getEnabledMultisigs.mock.calls.length;

    fireEvent.click(submit);
    await waitFor(() => expect(getEnabledMultisigs).toHaveBeenCalledTimes(checksBeforeSubmit + 1));
    fireEvent.click(submit);
    // antd validates before calling onFinish, so let the second submit settle before the check does.
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    await act(async () => check.resolve([A]));

    await waitFor(() => expect(onStep3Deploy).toHaveBeenCalledTimes(1));
    expect(getEnabledMultisigs).toHaveBeenCalledTimes(checksBeforeSubmit + 1);
  });

  it('says so when no wrapper is enabled on the chain', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([]);
    renderStep(GNOSIS);

    expect(
      await screen.findByText(/No multisig creation option is currently enabled on this chain/),
    ).toBeInTheDocument();
    expect(console.warn).toHaveBeenCalledWith(
      'No multisig creation option is enabled',
      expect.objectContaining({ chainId: GNOSIS }),
    );
  });

  it('deploys through the wrapper the owner picks when two are enabled', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A, B]).mockResolvedValueOnce([A, B]);
    onStep3Deploy.mockResolvedValue(undefined);
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(B));

    await waitFor(() =>
      expect(onStep3Deploy).toHaveBeenCalledWith('0xowner', '1', B, expect.any(String)),
    );
  });

  it('does not deploy when the submit re-check cannot be read', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockRejectedValueOnce(new Error('rpc down'));
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'Could not check that the selected multisig option is still enabled',
      ),
    );
    expect(onStep3Deploy).not.toHaveBeenCalled();
  });

  it('shows a failed load with a retry instead of a blank panel', async () => {
    getEnabledMultisigs.mockRejectedValueOnce(new Error('rpc down')).mockResolvedValueOnce([A]);
    renderStep(GNOSIS);

    expect(
      await screen.findByText('Could not check which multisig options are enabled on this chain.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('radio', { name: A })).toBeInTheDocument();
  });

  it('tells the owner why a deploy failed', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([A]);
    onStep3Deploy.mockRejectedValue(
      deployError(
        encodeErrorResult({
          abi,
          errorName: 'MultisigAlreadyBound',
          args: [A, BigInt(2), BigInt(1)],
        }),
      ),
    );
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        `Error occurred while deploying: MultisigAlreadyBound(${getAddress(A)}, 2, 1). Please try again.`,
      ),
    );
  });

  it('reports a deploy failure with no decoded revert without a reason', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([A]);
    onStep3Deploy.mockRejectedValue(deployError('0x'));
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith('Error occurred while deploying. Please try again.'),
    );
  });

  it('reports a deploy that succeeded even when the details refresh fails', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([A]);
    onStep3Deploy.mockResolvedValue(undefined);
    const { props } = renderStep(GNOSIS);
    props.updateDetails.mockRejectedValue(new Error('rpc down'));

    const submit = await selectWrapper(A);
    fireEvent.click(submit);

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'Deployed, but the service details could not be refreshed. Reload the page.',
      ),
    );
    expect(notifySuccess).toHaveBeenCalledWith('Deployed successfully');
    expect(notifyError).not.toHaveBeenCalledWith(
      expect.stringContaining('Error occurred while deploying'),
    );
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('refuses to deploy when the chain changed during the submit check', async () => {
    const check = deferred();
    getEnabledMultisigs
      .mockResolvedValueOnce([A])
      .mockReturnValueOnce(check.promise)
      .mockReturnValue(new Promise(() => undefined));
    const { switchChain } = renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));
    await waitFor(() => expect(getEnabledMultisigs).toHaveBeenCalledWith(GNOSIS));
    switchChain(OPTIMISM);
    await act(async () => check.resolve([A]));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'The network changed before the deploy. Please submit again.',
      ),
    );
    expect(onStep3Deploy).not.toHaveBeenCalled();
  });
});
