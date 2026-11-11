import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  encodeErrorResult,
  getAddress,
} from 'viem';

import { ethers } from 'ethers';

import { notifyError, notifySuccess } from 'libs/util-functions/src';
import { FALLBACK_HANDLER } from 'common-util/Contracts/addresses';

import bundledServiceManagerAbi from '../../fixtures/service-manager-1.3.0-abi.json';
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
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
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
  let spies = [];
  beforeEach(() => {
    // Not resetAllMocks / restoreAllMocks: they would also reset jest.setup's window.matchMedia
    // mock, which antd needs.
    [getEnabledMultisigs, onStep3Deploy, notifyError, notifySuccess, useHelpers].forEach((mock) =>
      mock.mockReset(),
    );
    spies = [
      jest.spyOn(console, 'warn').mockImplementation(() => undefined),
      jest.spyOn(console, 'error').mockImplementation(() => undefined),
    ];
  });
  afterEach(() => spies.forEach((spy) => spy.mockRestore()));

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

  it('ignores the previous chain late failure', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]);
    const { switchChain } = renderStep(GNOSIS);
    await selectWrapper(A);

    const staleOptimism = deferred();
    const freshGnosis = deferred();
    getEnabledMultisigs
      .mockReturnValueOnce(staleOptimism.promise)
      .mockReturnValueOnce(freshGnosis.promise);
    switchChain(OPTIMISM);
    switchChain(GNOSIS);

    await act(async () => freshGnosis.resolve([B]));
    await act(async () => staleOptimism.reject(new Error('rpc down')));

    expect(screen.getByRole('radio', { name: B })).toBeInTheDocument();
    expect(
      screen.queryByText('Could not check which multisig options are enabled on this chain.'),
    ).toBeNull();
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
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([B]);
    renderStep(GNOSIS);
    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'The selected multisig option is no longer enabled. Please choose another.',
      ),
    );
    expect(onStep3Deploy).not.toHaveBeenCalled();
    // The re-check's answer replaces the offered options and clears the selection.
    expect(screen.queryByRole('radio', { name: A })).toBeNull();
    expect(screen.getByRole('radio', { name: B })).not.toBeChecked();
    expect(screen.queryByRole('radio', { checked: true })).toBeNull();
  });

  it('deploys once when the form is submitted again during the enabled check', async () => {
    const check = deferred();
    getEnabledMultisigs.mockResolvedValue([A]);
    onStep3Deploy.mockResolvedValue(undefined);
    renderStep(GNOSIS);
    const submit = await selectWrapper(A);
    getEnabledMultisigs.mockReturnValue(check.promise);
    const checksBeforeSubmit = getEnabledMultisigs.mock.calls.length;

    fireEvent.click(submit);
    await waitFor(() => expect(getEnabledMultisigs).toHaveBeenCalledTimes(checksBeforeSubmit + 1));
    // The button is loading now, but Enter in a field still submits the form.
    fireEvent.submit(submit.closest('form'));
    // antd validates before calling onFinish; one macrotask lets that validation finish.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    await act(async () => check.resolve([A]));

    await waitFor(() => expect(onStep3Deploy).toHaveBeenCalled());
    expect(onStep3Deploy).toHaveBeenCalledTimes(1);
    expect(getEnabledMultisigs).toHaveBeenCalledTimes(checksBeforeSubmit + 1);
  });

  it('reads nothing while no chain is connected, and keeps showing the check', async () => {
    renderStep(undefined);

    expect(
      await screen.findByText(/Checking which multisig options are enabled on this chain/),
    ).toBeInTheDocument();
    expect(getEnabledMultisigs).not.toHaveBeenCalled();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('offers what the submit re-check found after a successful deploy', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A, B]).mockResolvedValueOnce([A]);
    onStep3Deploy.mockResolvedValue(undefined);
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledWith('Deployed successfully'));
    expect(screen.getByRole('radio', { name: A })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: B })).toBeNull();
  });

  it('shows that the enabled options are loading instead of a blank step', async () => {
    getEnabledMultisigs.mockReturnValue(deferred().promise);
    renderStep(GNOSIS);

    expect(
      await screen.findByText(/Checking which multisig options are enabled on this chain/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('radio')).toBeNull();
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
    const NOW_SECONDS = 1_700_000_000;
    spies.push(jest.spyOn(Date, 'now').mockReturnValue(NOW_SECONDS * 1000));
    getEnabledMultisigs.mockResolvedValueOnce([A, B]).mockResolvedValueOnce([A, B]);
    onStep3Deploy.mockResolvedValue(undefined);
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(B));

    // The form's defaults, packed in the order the wrapper decodes them.
    const payload = ethers.solidityPacked(
      ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'bytes'],
      [ZERO_ADDRESS, FALLBACK_HANDLER[GNOSIS], ZERO_ADDRESS, ZERO_ADDRESS, 0, NOW_SECONDS, '0x'],
    );
    await waitFor(() => expect(onStep3Deploy).toHaveBeenCalledWith('0xowner', '1', B, payload));
  });

  it('reports a malformed form value as a deploy failure, without deploying', async () => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([A]);
    renderStep(GNOSIS);
    const submit = await selectWrapper(A);

    fireEvent.change(screen.getByLabelText('To'), { target: { value: '0x123' } });
    fireEvent.click(submit);

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        expect.stringMatching(/^Error occurred while deploying: /),
      ),
    );
    expect(onStep3Deploy).not.toHaveBeenCalled();
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
        // Encoded with the published 1.3.0 ABI, decoded with the app's own.
        encodeErrorResult({
          abi: bundledServiceManagerAbi,
          errorName: 'MultisigAlreadyBound',
          args: [A, BigInt(2), BigInt(1)],
        }),
      ),
    );
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        `Error occurred while deploying: MultisigAlreadyBound(${getAddress(A)}, 2, 1)`,
      ),
    );
  });

  it.each([
    [
      'a revert the ABI does not know, by its selector',
      deployError('0xdeadbeef'),
      'unrecognised revert 0xdeadbeef',
    ],
    [
      'a failure that is not a revert, by its short message',
      new UserRejectedRequestError(new Error('User rejected the request.')),
      'User rejected the request.',
    ],
  ])('names %s', async (_, error, reason) => {
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockResolvedValueOnce([A]);
    onStep3Deploy.mockRejectedValue(error);
    renderStep(GNOSIS);

    fireEvent.click(await selectWrapper(A));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(`Error occurred while deploying: ${reason}`),
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
