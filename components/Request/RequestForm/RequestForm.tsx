import { Alert, Button, Flex, Form, Input, InputNumber, Select } from 'antd';
import React, { Fragment, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { getTokenId } from 'common-util/functions/requests';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { PAYMENT_TYPES } from 'util/constants';
import { allowOnlyNumbers } from 'util/formValidations';

import { getIpfsHashHelper } from './helpers';
import {
  useFetchTools,
  useMaxDeliveryRate,
  usePaymentType,
  useResponseTimeoutLimits,
} from './hooks';
import { CustomModal, FormContainer } from './styles';

export const FORM_NAME = 'ipfs_creation_form_for_mech';

export type FormValues = {
  prompt: string;
  tool: string;
  mechAddress: string;
  maxDeliveryRate: string;
  responseTimeout: number;
};

type RequestFormProps = {
  visible: boolean;
  tools?: string[] | string | null;
  mechAddresses: string[];
  onCancel: () => void;
  onSubmit: (
    values: FormValues & { hash: string; paymentType: string },
    onModalClose: () => void,
  ) => void;
  isLoading?: boolean;
};

export const RequestForm: React.FC<RequestFormProps> = ({
  visible,
  mechAddresses,
  onCancel,
  onSubmit,
  isLoading,
}) => {
  const [form] = Form.useForm();
  const mechAddress = Form.useWatch('mechAddress', form);
  const [isHashLoading, setIsHashLoading] = useState(false);
  const { account } = useHelpers();

  const { tools, isToolsLoading, fetchTools } = useFetchTools();
  const { data: maxDeliveryRate, isLoading: isMaxDeliveryRateLoading } =
    useMaxDeliveryRate(mechAddress);
  const { data: paymentType, isLoading: isPaymentTypeLoading } = usePaymentType(mechAddress);
  const { data: responseTimeoutLimits, isLoading: isResponseTimeoutLimitsLoading } =
    useResponseTimeoutLimits();

  useEffect(() => {
    if (mechAddress) {
      // Fetch tools whenever mech address changes
      fetchTools(mechAddress);
    }
  }, [fetchTools, mechAddress]);

  useEffect(() => {
    if (maxDeliveryRate) {
      // Set default value for maxDeliveryRate when data is ready
      form.setFieldsValue({ maxDeliveryRate: maxDeliveryRate.toString() });
    }
  }, [form, maxDeliveryRate]);

  const getPromptHash = async (values: FormValues): Promise<string | null> => {
    try {
      setIsHashLoading(true);
      const hash = await getIpfsHashHelper(
        {
          prompt: values.prompt,
          tool: values.tool,
          nonce: uuidv4(),
        },
        { noImage: true },
      );
      return hash;
    } catch (error) {
      console.error(error);
    } finally {
      setIsHashLoading(false);
    }
    return null;
  };

  const handleFinish = async (values: FormValues) => {
    if (!paymentType) return;

    const hash = await getPromptHash(values);
    if (!hash) {
      throw new Error('Unable to get hash');
    }

    onSubmit({ ...values, hash, paymentType }, onCancel);
  };

  const handleFinishFailed = (errorInfo: { values: FormValues }) => {
    console.error('Failed:', errorInfo);
  };

  return (
    <CustomModal
      open={visible}
      title="New request"
      destroyOnClose
      width={620}
      onCancel={onCancel}
      footer={[
        <Fragment key="footer-1">
          <Flex gap={8} justify="end">
            <Button type="default" onClick={onCancel}>
              Cancel
            </Button>

            <Button
              form="ipfsModalForm"
              htmlType="submit"
              type="primary"
              disabled={!account || isPaymentTypeLoading}
              loading={isHashLoading || isLoading}
            >
              Request
            </Button>
          </Flex>
          {!account && (
            <div className="text-gray-500 mt-12">To make a request, connect your wallet</div>
          )}
        </Fragment>,
      ]}
    >
      <FormContainer>
        <Form<FormValues>
          form={form}
          name={FORM_NAME}
          layout="vertical"
          autoComplete="off"
          preserve={false}
          id="ipfsModalForm"
          initialValues={{ mechAddress: mechAddresses[0] }}
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
        >
          {paymentType && PAYMENT_TYPES[paymentType]?.isNVM && (
            <Alert
              type="warning"
              showIcon
              message="Before proceeding with this request, please ensure you have an active NVM subscription"
              className="mb-12"
            />
          )}
          <Form.Item label="Mech address" name="mechAddress">
            <Select
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
              placeholder="Select mech address"
              loading={isToolsLoading}
              disabled={mechAddresses.length === 1}
              options={mechAddresses.map((address) => ({
                key: address,
                value: address,
                label: address,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Prompt"
            name="prompt"
            rules={[{ required: true, message: 'Please input the prompt' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Tool"
            name="tool"
            rules={[
              {
                required: true,
                message: 'Please select a tool',
              },
            ]}
          >
            {Array.isArray(tools) && tools.length > 0 ? (
              <Select
                getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
                placeholder="Select a tool"
                options={tools.map((tool) => ({
                  key: tool,
                  value: tool,
                  label: tool,
                }))}
              />
            ) : (
              <Input />
            )}
          </Form.Item>

          <Form.Item
            label="Max delivery rate, wei"
            name="maxDeliveryRate"
            rules={[
              { required: true, message: 'Please input the max delivery rate' },
              {
                validator: (_, value) => {
                  if (maxDeliveryRate && Number(value) > Number(maxDeliveryRate)) {
                    return Promise.reject(
                      new Error(
                        `Max delivery rate for the selected mech can not exceed ${maxDeliveryRate} wei`,
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input disabled={isMaxDeliveryRateLoading} onKeyDown={allowOnlyNumbers} />
          </Form.Item>

          <Form.Item
            label="Response timeout, seconds"
            name="responseTimeout"
            rules={[
              { required: true, message: 'Please input the max delivery rate' },
              {
                validator: (_, value) => {
                  const min = responseTimeoutLimits ? Number(responseTimeoutLimits.min) : 0;
                  const max = responseTimeoutLimits ? Number(responseTimeoutLimits.max) : 0;

                  if (responseTimeoutLimits && (Number(value) > max || Number(value) < min)) {
                    return Promise.reject(
                      new Error(`Response timeout must be between ${min} and ${max} seconds`),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
            className="full-width"
          >
            <InputNumber disabled={isResponseTimeoutLimitsLoading} />
          </Form.Item>
        </Form>
      </FormContainer>
    </CustomModal>
  );
};
