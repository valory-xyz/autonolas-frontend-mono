/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import {
  Button, Typography, Input, Form,
} from 'antd';
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from '@autonolas/frontend-library';

import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import { addressValidator } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks';
import {
  checkIfServiceIsWhitelisted,
  setOperatorsStatusesRequest,
} from './ServiceState/utils';

const { Text } = Typography;

export const OperatorWhitelist = ({ isWhiteListed, setOpWhitelist, id }) => {
  const { account, chainId } = useHelpers();
  const [form] = Form.useForm();

  const [isCheckLoading, setIsCheckLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      await setOpWhitelist(id);
    };

    if (id) getData();
  }, [id, chainId]);

  const onCheck = async (values) => {
    try {
      setIsCheckLoading(true);
      const isValid = await checkIfServiceIsWhitelisted(
        id,
        values.operatorAddress,
      );

      const message = `Operator ${values.operatorAddress} is ${
        isValid ? '' : 'NOT'
      } whitelisted`;
      if (isValid) notifySuccess(message);
      else notifyWarning(message);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCheckLoading(false);
    }
  };

  return (
    <>
      {isWhiteListed && (
        <>
          <Text>Check if Operator Address is whitelisted?</Text>
          <Form
            layout="inline"
            form={form}
            name="operator_address_form"
            autoComplete="off"
            onFinish={onCheck}
          >
            <Form.Item
              label="Operator Address"
              name="operatorAddress"
              rules={[
                { required: true, message: 'Please input the address' },
                addressValidator,
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item>
              <Button
                htmlType="submit"
                loading={isCheckLoading}
                disabled={!account}
              >
                Check
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </>
  );
};

export const SetOperatorStatus = ({ id, setOpWhitelist }) => {
  const { account } = useHelpers();
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const onSubmit = async (values) => {
    try {
      setIsSubmitLoading(true);
      await setOperatorsStatusesRequest({
        account,
        serviceId: id,
        operatorAddresses: values.operatorAddress,
        operatorStatuses: values.status.map((e) => e === 'true'),
      });
      await setOpWhitelist();
      notifySuccess('Operator status updated');
    } catch (error) {
      console.error(error);
      notifyError('Error occurred while updating operator status');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <>
      <DynamicFieldsForm
        isLoading={isSubmitLoading}
        onSubmit={onSubmit}
        submitButtonText="Submit"
      />
      <Text type="secondary">
        By submitting will instantly enable whitelisting
      </Text>
    </>
  );
};