import { Button, Form, Input, Typography } from 'antd';
import { useEffect } from 'react';
import styled from 'styled-components';
import { FORM_TYPES } from 'libs/util-constants/src';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { FormList } from './FormList';

const { Text } = Typography;

export const DynamicFormContainer = styled.div`
  max-width: 720px;
  .ant-input-number {
    width: 200px;
  }
`;

type Unit = {
  unitId: number;
  unitType: string;
};

type DynamicFieldsFormProps = {
  isUnitTypeInput?: boolean;
  inputOneLabel?: string;
  inputTwoLabel?: string;
  buttonText?: string;
  isLoading: boolean;
  submitButtonText: string;
  onSubmit: (values: { unitIds: number[]; unitTypes: string[]; address: string }) => Promise<void>;
  canResetOnSubmit?: boolean;
  dynamicFormType?: string | null;
  showAscendingOrderMessage?: boolean;
};

export const DynamicFieldsForm = ({
  isUnitTypeInput = true,
  inputOneLabel = 'Unit ID',
  inputTwoLabel = 'Unit Type',
  buttonText = 'Add row',
  isLoading = false,
  submitButtonText = 'Submit',
  onSubmit,
  canResetOnSubmit = false,
  dynamicFormType = null,
  showAscendingOrderMessage = false,
}: DynamicFieldsFormProps) => {
  const { account } = useHelpers();
  const [form] = Form.useForm();

  useEffect(() => {
    if (account) {
      if (dynamicFormType === FORM_TYPES.CLAIMABLE_INCENTIVES) {
        form.setFieldsValue({ address: account });
      }
    }
  }, [account]);

  const onFinish = async (values: { units: Unit[]; address?: string }) => {
    if (onSubmit) {
      try {
        await onSubmit({
          unitIds: values.units.map((unit: Unit) => unit.unitId),
          unitTypes: values.units.map((unit: Unit) => unit.unitType),
          address: values.address as string,
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
      <Form form={form} name="dynamic_form_complex" onFinish={onFinish} autoComplete="off">
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
          <Button type="primary" htmlType="submit" loading={isLoading} disabled={!account}>
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
