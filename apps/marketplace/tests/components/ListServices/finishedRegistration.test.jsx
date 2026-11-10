import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { notifyError } from 'libs/util-functions/src';
import { useHelpers } from 'common-util/hooks';

import { FinishedRegistration } from '../../../components/ListServices/ServiceState/3rdStepFinishedRegistration';
import { onStep3Deploy } from '../../../components/ListServices/ServiceState/utils';
import { getEnabledMultisigs } from '../../../components/ListServices/utils';

jest.mock('libs/util-functions/src', () => ({
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
  return { switchChain };
};

const selectWrapper = async (address) => {
  fireEvent.click(await screen.findByRole('radio', { name: address }));
  return screen.findByRole('button', { name: 'Submit' });
};

describe('FinishedRegistration multisig picker', () => {
  beforeEach(() => {
    // Not resetAllMocks: that would also reset jest.setup's window.matchMedia mock, which antd needs.
    [getEnabledMultisigs, onStep3Deploy, notifyError, useHelpers].forEach((mock) => mock.mockReset());
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
    getEnabledMultisigs.mockResolvedValueOnce([A]).mockReturnValueOnce(check.promise);
    onStep3Deploy.mockResolvedValue(undefined);
    renderStep(GNOSIS);
    const submit = await selectWrapper(A);
    const checksBeforeSubmit = getEnabledMultisigs.mock.calls.length;

    fireEvent.click(submit);
    await waitFor(() =>
      expect(getEnabledMultisigs).toHaveBeenCalledTimes(checksBeforeSubmit + 1),
    );
    fireEvent.click(submit);
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
});
