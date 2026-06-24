import { Button, Divider, Form, Input, Radio } from 'antd';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { notifyError, notifySuccess } from 'libs/util-functions/src';
import { FALLBACK_HANDLER, multisigAddresses } from 'common-util/Contracts/addresses';
import { RegistryForm } from 'common-util/TransactionHelpers/RegistryForm';
import { SendTransactionButton } from 'common-util/TransactionHelpers/SendTransactionButton';
import { isValidSolanaPublicKey } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks';
import { SVM_EMPTY_ADDRESS } from 'util/constants';

import { RadioLabel } from '../styles';
import { useFinishRegistration } from '../useSvmServiceStateManagement';
import { onStep3Deploy } from '../utils';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const handleStep3Deploy = async (radioValuePassed, payload) => {
    try {
      setIsSubmitting(true);
      await onStep3Deploy(account, serviceId, radioValuePassed, payload);

      await updateDetails();
      notifySuccess('Deployed successfully');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinish = (values) => {
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

    handleStep3Deploy(radioValue, payload);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

  const options = multisigAddresses[chainId] || [];
  const isMultiSig = options[0];
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

      {/* form is shown only once the multisig option is selected */}
      {radioValue === isMultiSig && (
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
