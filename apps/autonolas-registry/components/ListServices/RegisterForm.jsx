import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useDeepCompareEffect from 'use-deep-compare-effect';
import PropTypes from 'prop-types';
import { Button, Form, Input } from 'antd';
import { isValidAddress, notifyError } from '@autonolas/frontend-library';

import { DEFAULT_SERVICE_CREATION_ETH_TOKEN } from 'util/constants';
import { commaMessage, DependencyLabel } from 'common-util/List/ListCommon';
import { FormItemHash } from 'common-util/List/RegisterForm/helpers';
import { IpfsHashGenerationModal } from 'common-util/List/IpfsHashGenerationModal';
import { RegistryForm } from 'common-util/TransactionHelpers/RegistryForm';
import { isValidSolanaPublicKey } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks';
import { ComplexLabel } from 'common-util/List/styles';

export const FORM_NAME = 'serviceRegisterForm';

const agentIdValidator = (form, value) => {
  if (!/^\d+(\s*,\s*\d+?)*$/gm.test(value)) {
    return Promise.reject(new Error('Please input a valid list'));
  }

  const agentIdsStr = form.getFieldValue('agent_ids');
  if (!agentIdsStr) {
    return Promise.resolve();
  }

  // validate if the "agentIds" and "bonds" are same length
  // eg: If "agent_num_slots" length = 4, "bonds" should be of length = 4
  const agentIdsLength = agentIdsStr.split(',').length;
  const bondsLength = value.split(',').length;

  if (agentIdsLength !== bondsLength) {
    return Promise.reject(
      new Error('Must have same number of items as "Canonical agent Ids"'),
    );
  }

  return Promise.resolve();
};

/**
 * validates the owner address based on the network type
 */
const validateOwnerAddress = async (isSvm, listType, value) => {
  if (isSvm) {
    if (isValidSolanaPublicKey(value)) return Promise.resolve();

    return Promise.reject(
      new Error(
        `Please input a valid SVM public key for the ${listType} Owner`,
      ),
    );
  }

  if (isValidAddress(value)) return Promise.resolve();

  return Promise.reject(
    new Error(`Please input a valid address for the ${listType} Owner`),
  );
};

/**
 * validates the threshold based on the no. of slots
 */
const validateThreshold = (form, getFieldValue, value) => {
  if (!value || !getFieldValue('agent_num_slots')) {
    Promise.resolve();
  }

  // eg: 1, 2, 1 and sumOfSlots = 4
  const sumOfSlots = form
    .getFieldValue('agent_num_slots')
    .split(',')
    .reduce((sum, num) => sum + parseInt(num.trim(), 10), 0);

  // eg: 2/3 * 4 = 2.66
  // Now, threshold should be at least 2.66 and not exceed the sum of no. of slots
  // ie. threshold >= 2.66 && threshold <= 4
  const threshold = parseInt(value, 10);
  if (threshold >= (2 / 3) * sumOfSlots && threshold <= sumOfSlots) {
    return Promise.resolve();
  }

  return Promise.reject(
    new Error(
      'Threshold must be at least 2/3 and not exceed the sum of no. of slots',
    ),
  );
};

/**
 * Service creation form
 */
const RegisterForm = ({
  isLoading,
  listType,
  isUpdateForm,
  formInitialValues,
  ethTokenAddress,
  handleSubmit,
}) => {
  const { account, doesNetworkHaveValidServiceManagerToken, isSvm } = useHelpers();

  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fields, setFields] = useState([]);
  const router = useRouter();
  const id = router?.query?.id;

  useEffect(() => {
    if (account && ethTokenAddress && doesNetworkHaveValidServiceManagerToken) {
      setFields([{ name: ['token'], value: ethTokenAddress }]);
    }
  }, [account, doesNetworkHaveValidServiceManagerToken, ethTokenAddress]);

  // callback function to get the generated hash from the modal
  const onGenerateHash = (generatedHash) => {
    setFields([{ name: ['hash'], value: generatedHash || null }]);
  };

  useDeepCompareEffect(() => {
    if (isUpdateForm) {
      // For SVM, slots and bonds are returned as part of the details but
      // eg. slots: [1, 2, 1] and bonds: [5000000000000, 5000000000000, 5000000000000]
      // for EVM, they are present in `agentParams` array, ie
      // 1st element is array of slots and 2nd element is array of bonds
      // eg: agentParams: [[1, 2, 1], [5000000000000, 5000000000000, 5000000000000]]
      const agentNumSlots = isSvm
        ? formInitialValues.slots?.join(', ')
        : (formInitialValues.agentParams || [])
          .map((param) => param[0])
          .join(', ');

      const bonds = isSvm
        ? formInitialValues.bonds?.join(', ')
        : (formInitialValues.agentParams || [])
          .map((param) => param[1])
          .join(', ');

      setFields([
        { name: ['owner_address'], value: formInitialValues.owner || null },
        {
          name: ['hash'],
          // remove 0x prefix as it is already coming from backend
          // If not removed, it will throw error
          value: formInitialValues?.configHash?.replace(/0x/i, ''),
        },
        {
          name: ['agent_ids'],
          value: formInitialValues.agentIds
            ? formInitialValues.agentIds.join(', ')
            : null,
        },
        { name: ['agent_num_slots'], value: agentNumSlots },
        { name: ['bonds'], value: bonds },
        { name: ['threshold'], value: formInitialValues.threshold || null },
        { name: ['service_id'], value: id },
      ]);
    }
  }, [formInitialValues, isUpdateForm]);

  // trigger form validation on form fields change (`agent_ids`)
  const agentIds = form.getFieldValue('agent_ids');
  useEffect(() => {
    if (form.getFieldValue('agent_ids')?.trim()?.length > 0) {
      const fieldsToValidate = [];

      if (form.getFieldValue('agent_num_slots')?.trim()?.length > 0) {
        fieldsToValidate.push('agent_num_slots');
      }

      if (form.getFieldValue('bonds')?.trim()?.length > 0) {
        fieldsToValidate.push('bonds');
      }

      form.validateFields(fieldsToValidate);
    }
  }, [agentIds, form]);

  /**
   * form helper functions
   */
  const onFinish = (values) => {
    handleSubmit(values);
  };

  const onFinishFailed = (errorInfo) => {
    window.console.log('Failed:', errorInfo);
  };

  const hashValue = form.getFieldValue('hash');

  const handlePrefillAddress = () => {
    if (!account) {
      notifyError('Connect a wallet');
      return;
    }

    form.setFieldsValue({ owner_address: account });
  };

  return (
    <>
      <RegistryForm
        name={FORM_NAME}
        form={form}
        initialValues={{ remember: true }}
        layout="vertical"
        fields={fields}
        onFieldsChange={(_, allFields) => setFields(allFields)}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Owner Address"
          name="owner_address"
          validateFirst
          className="mb-0"
          rules={[
            {
              required: true,
              message: `Please input the address of the ${listType} Owner`,
            },
            () => ({
              validator: (_, value) => validateOwnerAddress(isSvm, listType, value),
            }),
          ]}
        >
          <Input
            placeholder={isSvm ? 'pWK1v…' : '0x862…'}
            disabled={isUpdateForm}
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Button
            htmlType="button"
            type="link"
            onClick={handlePrefillAddress}
            className="pl-0"
            disabled={!account || isUpdateForm}
          >
            Prefill Address
          </Button>
        </Form.Item>

        {/* generic token visible only to L1 EVM networks */}
        {doesNetworkHaveValidServiceManagerToken && !isSvm && (
          <>
            <Form.Item
              label="ERC20 token address"
              name="token"
              tooltip="Generic ERC20 token address to secure the service (ETH by default)"
              // dedicated address for standard ETH secured service creation
              // user can change it if they want to use a different generic token
              initialValue={
                ethTokenAddress || DEFAULT_SERVICE_CREATION_ETH_TOKEN
              }
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: 'Please input the token address',
                },
                () => ({
                  validator(_, value) {
                    if (isValidAddress(value)) return Promise.resolve();
                    return Promise.reject(
                      new Error('Please input a valid address'),
                    );
                  },
                }),
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item className="mb-0">
              <Button
                htmlType="button"
                type="link"
                onClick={() => form.setFieldsValue({
                  token: DEFAULT_SERVICE_CREATION_ETH_TOKEN,
                })}
                className="pl-0"
                disabled={!account}
              >
                Prefill Default Eth Address
              </Button>
            </Form.Item>
          </>
        )}

        {isUpdateForm && (
          <Form.Item
            label="Service Id"
            name="service_id"
            rules={[{ required: true, message: 'Please input the Service ID' }]}
          >
            <Input disabled={isUpdateForm} />
          </Form.Item>
        )}

        <FormItemHash listType={listType} hashValue={hashValue} />

        <Button
          type="primary"
          ghost
          onClick={() => setIsModalVisible(true)}
          className="mb-12"
          data-testid="generate-hash-file"
        >
          {isUpdateForm ? 'Update' : 'Generate'}
          &nbsp;Hash & File
        </Button>

        <Form.Item
          name="agent_ids"
          validateFirst
          label={(
            <ComplexLabel>
              Canonical agent Ids
              <DependencyLabel type="service" />
            </ComplexLabel>
          )}
          rules={[
            {
              required: true,
              message: 'Please input the agent Ids',
            },
            () => ({
              validator(_, value) {
                if (/^\d+(\s*,\s*\d+?)*$/gm.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Please input a valid list'));
              },
            }),
          ]}
        >
          <Input placeholder="2, 10, 15" />
        </Form.Item>

        <Form.Item
          label={(
            <ComplexLabel>
              No. of slots to canonical agent Ids
              <div className="label-helper-text">
                Specify the number of agent instances for each canonical agent
                listed above. Each canonical agent must have at least one
                instance.&nbsp;
                {commaMessage}
              </div>
            </ComplexLabel>
          )}
          name="agent_num_slots"
          validateFirst
          rules={[
            {
              required: true,
              message: 'Please input the slots to canonical agent Ids',
            },
            () => ({
              validator: (_, value) => agentIdValidator(form, value),
            }),
          ]}
        >
          <Input placeholder="1, 2, 1" />
        </Form.Item>

        <Form.Item
          label={`Cost of agent instance bond (${isSvm ? 'lamports' : 'wei'})`}
          validateFirst
          name="bonds"
          rules={[
            {
              required: true,
              message: 'Please input the cost of agent instance bond',
            },
            () => ({
              validator: (_, value) => agentIdValidator(form, value),
            }),
          ]}
        >
          <Input placeholder="5000000000000000, 5000000000000000, 5000000000000000" />
        </Form.Item>

        <Form.Item
          label="Threshold"
          name="threshold"
          help="Threshold must be at least 2/3 the sum of no. of slots and not exceed the sum of no. of slots"
          rules={[
            { required: true, message: 'Please input the threshold' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                return validateThreshold(form, getFieldValue, value);
              },
            }),
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={!account}
          >
            Submit
          </Button>
        </Form.Item>
      </RegistryForm>

      <IpfsHashGenerationModal
        visible={isModalVisible}
        type={listType}
        callback={onGenerateHash}
        handleCancel={() => setIsModalVisible(false)}
      />
    </>
  );
};

RegisterForm.propTypes = {
  isUpdateForm: PropTypes.bool,
  listType: PropTypes.string,
  isLoading: PropTypes.bool,
  formInitialValues: PropTypes.shape({
    owner: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    configHash: PropTypes.string,
    agentIds: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ),
    agentNumSlots: PropTypes.arrayOf(PropTypes.string),
    agentParams: PropTypes.arrayOf(PropTypes.shape({})),
    threshold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    // the values below are present for SVM only 👇
    bonds: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ),
    slots: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ),
  }),
  handleSubmit: PropTypes.func.isRequired,
  ethTokenAddress: PropTypes.string,
};

RegisterForm.defaultProps = {
  isLoading: false,
  isUpdateForm: false,
  listType: 'Service',
  formInitialValues: {},
  ethTokenAddress: DEFAULT_SERVICE_CREATION_ETH_TOKEN,
};

export default RegisterForm;