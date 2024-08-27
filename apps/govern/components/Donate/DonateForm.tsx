import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Grid, InputNumber, Space, Typography } from 'antd';
import styled from 'styled-components';
import { useAccount } from 'wagmi';

const { Text } = Typography;
const { useBreakpoint } = Grid;

export const DynamicFormContainer = styled.div`
  max-width: 720px;
  .ant-input-number {
    width: 200px;
  }
`;

type DonateFormProps = {
  isLoading: boolean;
  onSubmit: ({ unitIds, amounts }: { unitIds: number[]; amounts: number[] }) => Promise<void>;
};

export const DonateForm = ({ isLoading, onSubmit }: DonateFormProps) => {
  const { address: account } = useAccount();
  const [form] = Form.useForm();

  const screens = useBreakpoint();
  const inputStyle = screens.xs ? { width: '140px' } : { width: 'auto' };

  const onFinish = async (values: { units: { unitId: number; amount: number }[] }) => {
    if (onSubmit) {
      try {
        await onSubmit({
          unitIds: values.units.map((unit) => unit.unitId),
          amounts: values.units.map((unit) => unit.amount),
        });

        form.resetFields();
      } catch (error) {
        window.console.error(error);
      }
    }
  };

  return (
    <DynamicFormContainer>
      <Form form={form} name="dynamic_form_complex" onFinish={onFinish} autoComplete="off">
        <Form.List
          name="units"
          initialValue={[{ unitId: undefined, unitType: undefined }]}
          rules={[
            {
              validator: async (_, units) => {
                if (!units || units?.length === 0) {
                  return Promise.reject(new Error('At least 1 unit is required'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} align="baseline">
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) => prevValues.units !== curValues.units}
                  >
                    {() => (
                      <Form.Item
                        {...field}
                        label="Service ID"
                        name={[field.name, 'unitId']}
                        rules={[
                          {
                            required: true,
                            message: 'Please add Service ID',
                          },
                        ]}
                      >
                        <InputNumber
                          min={0}
                          className="mr-24"
                          placeholder="Eg. 1"
                          style={inputStyle}
                        />
                      </Form.Item>
                    )}
                  </Form.Item>

                  <Form.Item
                    {...field}
                    label="Amount (ETH)"
                    name={[field.name, 'amount']}
                    rules={[{ required: true, message: 'Please add Amount (ETH)' }]}
                  >
                    <InputNumber min={0} placeholder="Eg. 0.065" style={inputStyle} />
                  </Form.Item>

                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(field.name)} />}
                </Space>
              ))}

              <Form.ErrorList errors={errors} />

              <Form.Item wrapperCol={{ span: 6 }}>
                <Button size="large" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add row
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={!account}
          >
            Donate
          </Button>

          {!account && (
            <Text className="ml-8" type="secondary">
              To donate, connect a wallet
            </Text>
          )}
        </Form.Item>
      </Form>
    </DynamicFormContainer>
  );
};
