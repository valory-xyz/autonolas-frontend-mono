import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Typography, Input } from 'antd';
import styled from 'styled-components';

import { FORM_TYPES } from 'common-util/enums';
import { useHelpers } from '../hooks/useHelpers';
import { FormList } from './FormList';

const { Text } = Typography;

export const DynamicFormContainer = styled.div`
  max-width: 720px;
  .ant-input-number {
    width: 200px;
  }
`;

export const DynamicFieldsForm = ({
  isUnitTypeInput,
  inputOneLabel,
  inputTwoLabel,
  buttonText,
  isLoading,
  submitButtonText,
  onSubmit,
  canResetOnSubmit,
  dynamicFormType,
  showAscendingOrderMessage,
}) => {
  const { account } = useHelpers();
  const [form] = Form.useForm();

  useEffect(() => {
    if (account) {
      if (dynamicFormType === FORM_TYPES.CLAIMABLE_INCENTIVES) {
        form.setFieldsValue({ address: account });
      }
    }
  }, [account]);

  const onFinish = async (values) => {
    if (onSubmit) {
      try {
        await onSubmit({
          unitIds: values.units.map((unit) => unit.unitId),
          unitTypes: values.units.map((unit) => unit.unitType),
          address: values.address,
        });

        if (canResetOnSubmit) {
          form.resetFields();
        }
      } catch (error) {
        window.console.error(error);
      }
    }
  };

  return (
    <DynamicFormContainer>
      <Form
        form={form}
        name="dynamic_form_complex"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* address input is only visible for claimable incentives */}
        {dynamicFormType === FORM_TYPES.CLAIMABLE_INCENTIVES && (
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please add address' }]}
          >
            <Input placeholder="Eg. 0x" />
          </Form.Item>
        )}

        <FormList
          isUnitTypeInput={isUnitTypeInput}
          inputOneLabel={inputOneLabel}
          inputTwoLabel={inputTwoLabel}
          buttonText={buttonText}
          showAscendingOrderMessage={showAscendingOrderMessage}
        />

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={!account}
          >
            {submitButtonText}
          </Button>

          {!account && (
            <Text className="ml-8" type="secondary">
              {`To ${(submitButtonText || '').toLowerCase()}, connect a wallet`}
            </Text>
          )}
        </Form.Item>
      </Form>
    </DynamicFormContainer>
  );
};

DynamicFieldsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  inputOneLabel: PropTypes.string,
  inputTwoLabel: PropTypes.string,
  buttonText: PropTypes.string,
  submitButtonText: PropTypes.string,
  isLoading: PropTypes.bool,
  isUnitTypeInput: PropTypes.bool,
  dynamicFormType: PropTypes.string,
  canResetOnSubmit: PropTypes.bool,
  showAscendingOrderMessage: PropTypes.bool,
};

DynamicFieldsForm.defaultProps = {
  inputOneLabel: 'Unit ID',
  inputTwoLabel: 'Unit Type',
  buttonText: 'Add row',
  submitButtonText: 'Submit',
  isLoading: false,
  isUnitTypeInput: true,
  dynamicFormType: null,
  canResetOnSubmit: false,
  showAscendingOrderMessage: false,
};
