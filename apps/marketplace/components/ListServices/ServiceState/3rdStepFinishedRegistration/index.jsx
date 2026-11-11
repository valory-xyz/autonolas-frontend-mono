import { Alert, Button, Divider, Form, Input, Radio, Spin } from 'antd';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import {
  errorMessage,
  findContractRevert,
  formatRevert,
  notifyError,
  notifySuccess,
} from 'libs/util-functions/src';
import { FALLBACK_HANDLER, multisigCandidates } from 'common-util/Contracts/addresses';
import { RegistryForm } from 'common-util/TransactionHelpers/RegistryForm';
import { SendTransactionButton } from 'common-util/TransactionHelpers/SendTransactionButton';
import { isValidSolanaPublicKey } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks';
import { SVM_EMPTY_ADDRESS } from 'util/constants';

import { RadioLabel } from '../styles';
import { useFinishRegistration } from '../useSvmServiceStateManagement';
import { getEnabledMultisigs } from '../../utils';
import { onStep3Deploy } from '../utils';

const MULTISIG_STATUS = Object.freeze({ LOADING: 'loading', LOADED: 'loaded', ERROR: 'error' });

const STEP = 3;
const OPTION_1 = 'Creates a new service multisig with currently registered agent instances';

const SvmFinishedRegistration = ({
  isOwner,
  serviceId,
  multisig,
  updateDetails,
  getButton,
  getOtherBtnProps,
  terminateBtn = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSvmStep3Deploy = useFinishRegistration();
  const btnProps = getOtherBtnProps(STEP);

  const onFinish = async (values) => {
    try {
      setIsSubmitting(true);
      await onSvmStep3Deploy(serviceId, values.addressTo);

      updateDetails();
      notifySuccess('Deployed successfully');
    } catch (error) {
      console.error(error);
      notifyError('Error occurred while deploying. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="step-3-finished-registration">
      <Form
        layout="inline"
        preserve={false}
        onFinish={onFinish}
        fields={[{ name: ['addressTo'], value: multisig }]}
        autoComplete="off"
        id="svmFinishedRegistrationForm"
        name="svm-finished-registration-form"
        className="mb-8"
      >
        <Form.Item
          label="Multisig Address"
          name="addressTo"
          rules={[
            { required: false },
            {
              validator: async (_, value) => {
                if (!value || value === SVM_EMPTY_ADDRESS) {
                  return Promise.reject(new Error('Please enter multisig address'));
                }

                if (!isValidSolanaPublicKey(value)) {
                  return Promise.reject(new Error('Not a valid multisig address'));
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Input disabled={btnProps.disabled} size="small" />
        </Form.Item>

        <Form.Item>
          {getButton(
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              {...getOtherBtnProps(STEP, { isDisabled: !isOwner })}
            >
              Submit
            </Button>,
            { step: STEP },
          )}
        </Form.Item>
      </Form>

      {terminateBtn}
    </div>
  );
};

SvmFinishedRegistration.propTypes = {
  multisig: PropTypes.string.isRequired,
  isOwner: PropTypes.bool.isRequired,
  terminateBtn: PropTypes.node,
  getButton: PropTypes.func.isRequired,
  serviceId: PropTypes.string.isRequired,
  getOtherBtnProps: PropTypes.func.isRequired,
  updateDetails: PropTypes.func.isRequired,
};

/**
 * FinishedRegistration component
 */
export const FinishedRegistration = ({
  isOwner,
  serviceId,
  multisig,
  handleTerminate,
  getOtherBtnProps,
  getButton,
  updateDetails,
}) => {
  const { account, chainId, isSvm } = useHelpers();

  const [form] = Form.useForm();
  const [radioValue, setRadioValue] = useState(null);
  const [multisigs, setMultisigs] = useState({ status: MULTISIG_STATUS.LOADING, enabled: [] });
  const [reloadCount, setReloadCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  // The submit awaits RPC calls, so it compares against the chain at the time of the deploy.
  const chainIdRef = useRef(chainId);
  chainIdRef.current = chainId;
  const [isTerminating, setIsTerminating] = useState(false);

  useEffect(() => {
    setRadioValue(null);
    setMultisigs({ status: MULTISIG_STATUS.LOADING, enabled: [] });
    if (isSvm || !chainId) return undefined;

    let isCurrent = true;
    getEnabledMultisigs(chainId)
      .then((enabled) => {
        if (!isCurrent) return;
        if (enabled.length === 0) {
          console.warn('No multisig creation option is enabled', {
            chainId,
            candidates: multisigCandidates[chainId] ?? [],
          });
        }
        setMultisigs({ status: MULTISIG_STATUS.LOADED, enabled });
      })
      .catch((error) => {
        console.error('Could not read the enabled multisig options', { chainId }, error);
        if (isCurrent) setMultisigs({ status: MULTISIG_STATUS.ERROR, enabled: [] });
      });
    return () => {
      isCurrent = false;
    };
  }, [chainId, isSvm, reloadCount]);

  const onFinish = async (values) => {
    // The enabled-wrapper check below awaits an RPC call, so guard against a second submit.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    const submitChainId = chainId;
    try {
      // The wrapper may have been disabled since the options were loaded.
      let enabled;
      try {
        enabled = await getEnabledMultisigs(submitChainId);
      } catch (error) {
        console.error(
          'Could not re-check the selected multisig option',
          { chainId: submitChainId, serviceId, multisig: radioValue },
          error,
        );
        notifyError('Could not check that the selected multisig option is still enabled');
        return;
      }
      if (chainIdRef.current !== submitChainId) {
        notifyError('The network changed before the deploy. Please submit again.');
        return;
      }
      setMultisigs({ status: MULTISIG_STATUS.LOADED, enabled });
      if (!enabled.includes(radioValue)) {
        setRadioValue(null);
        notifyError('The selected multisig option is no longer enabled. Please choose another.');
        return;
      }

      try {
        const payload = ethers.solidityPacked(
          ['address', 'address', 'address', 'address', 'uint256', 'uint256', 'bytes'],
          [
            values.addressTo,
            values.addressFallbackHandler,
            values.paymentToken,
            values.payablePaymentReceiver,
            Number(values.payment),
            Number(values.nonce),
            values.payload,
          ],
        );
        await onStep3Deploy(account, serviceId, radioValue, payload);
      } catch (error) {
        console.error(error);
        notifyError(`Error occurred while deploying: ${getDeployFailureReason(error)}`);
        return;
      }
      notifySuccess('Deployed successfully');
      await updateDetails();
    } catch (e) {
      console.error(e);
      notifyError('Deployed, but the service details could not be refreshed. Reload the page.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const getDeployFailureReason = (error) => {
    const revert = findContractRevert(error);
    if (revert?.data) return formatRevert(revert.data);
    if (revert?.signature) return `unrecognised revert ${revert.signature}`;
    return errorMessage(error);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

  const options = multisigs.status === MULTISIG_STATUS.LOADED ? multisigs.enabled : [];
  const btnProps = getOtherBtnProps(STEP);

  const terminateBtn = (
    <>
      <Divider className="m-0" />
      {getButton(
        <SendTransactionButton
          onClick={async () => {
            try {
              setIsTerminating(true);
              await handleTerminate();
            } catch (error) {
              console.error(error);
            } finally {
              setIsTerminating(false);
            }
          }}
          loading={isTerminating}
          className="terminate-btn"
          {...getOtherBtnProps(STEP, { isDisabled: !isOwner })}
        >
          Terminate
        </SendTransactionButton>,
        { step: STEP },
      )}
    </>
  );

  if (isSvm) {
    return (
      <SvmFinishedRegistration
        isOwner={isOwner}
        serviceId={serviceId}
        multisig={multisig}
        updateDetails={updateDetails}
        getButton={getButton}
        getOtherBtnProps={getOtherBtnProps}
        terminateBtn={terminateBtn}
      />
    );
  }

  return (
    <div className="step-3-finished-registration">
      {options?.length ? (
        <Radio.Group
          value={radioValue}
          onChange={(e) => setRadioValue(e.target.value)}
          disabled={btnProps.disabled}
          className="mt-8"
        >
          {options.map((multisigAddress) => (
            <div className="mb-12" key={`multisig-${multisigAddress}`}>
              <RadioLabel disabled={btnProps.disabled}>{OPTION_1}</RadioLabel>

              <Radio key={multisigAddress} value={multisigAddress}>
                {multisigAddress}
              </Radio>
            </div>
          ))}
        </Radio.Group>
      ) : null}

      {multisigs.status === MULTISIG_STATUS.LOADING && (
        <div className="mt-8">
          <Spin size="small" /> Checking which multisig options are enabled on this chain…
        </div>
      )}

      {multisigs.status === MULTISIG_STATUS.ERROR && (
        <Alert
          type="error"
          showIcon
          className="mt-8"
          message="Could not check which multisig options are enabled on this chain."
          action={
            <Button size="small" onClick={() => setReloadCount((count) => count + 1)}>
              Retry
            </Button>
          }
        />
      )}

      {multisigs.status === MULTISIG_STATUS.LOADED && multisigs.enabled.length === 0 && (
        <Alert
          type="warning"
          showIcon
          className="mt-8"
          message="No multisig creation option is currently enabled on this chain, so the service cannot be deployed right now."
        />
      )}

      {/* form is shown only once the multisig option is selected */}
      {radioValue && options.includes(radioValue) && (
        <RegistryForm
          form={form}
          layout="vertical"
          name="finished-registration-form"
          autoComplete="off"
          preserve={false}
          id="finishedRegistrationForm"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="To"
            name="addressTo"
            rules={[{ required: false }]}
            initialValue="0x0000000000000000000000000000000000000000"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Fallback Handler"
            name="addressFallbackHandler"
            rules={[{ required: true, message: 'Please input Fallback Handler' }]}
            initialValue={FALLBACK_HANDLER[chainId]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Payment Token"
            name="paymentToken"
            rules={[{ required: false }]}
            initialValue="0x0000000000000000000000000000000000000000"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Payable PaymentReceiver"
            name="payablePaymentReceiver"
            rules={[{ required: false }]}
            initialValue="0x0000000000000000000000000000000000000000"
          >
            <Input />
          </Form.Item>

          <Form.Item label="Payment" name="payment" rules={[{ required: false }]} initialValue={0}>
            <Input />
          </Form.Item>

          <Form.Item
            label="Nonce"
            name="nonce"
            rules={[{ required: true, message: 'Please input Nonce' }]}
            initialValue={parseInt(Date.now() / 1000, 10)}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Payload" name="payload" rules={[{ required: false }]} initialValue="0x">
            <Input />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            {getButton(
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                {...getOtherBtnProps(STEP, {
                  isDisabled: !radioValue || !isOwner,
                })}
              >
                Submit
              </Button>,
              { step: STEP },
            )}
          </Form.Item>
        </RegistryForm>
      )}

      {terminateBtn}
    </div>
  );
};

FinishedRegistration.propTypes = {
  isOwner: PropTypes.bool.isRequired,
  serviceId: PropTypes.string.isRequired,
  multisig: PropTypes.string.isRequired,
  handleTerminate: PropTypes.func.isRequired,
  getButton: PropTypes.func.isRequired,
  getOtherBtnProps: PropTypes.func.isRequired,
  updateDetails: PropTypes.func.isRequired,
};
