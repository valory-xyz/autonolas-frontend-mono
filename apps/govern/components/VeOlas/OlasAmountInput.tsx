import { Form, InputNumber, Typography } from 'antd';

const { Text } = Typography;

type OlasAmountInputProps = {
  olasBalance?: string;
};
/**
 * @returns Amount Input
 */
export const OlasAmountInput = ({ olasBalance }: OlasAmountInputProps) => {
  return (
    <Form.Item
      className="mb-4"
      name="amount"
      label={<Text type="secondary">OLAS amount to lock</Text>}
      rules={[
        { required: true, message: 'Amount is required' },
        () => ({
          validator(_, value) {
            if (value === '' || value === null) return Promise.resolve();
            if (value <= 0) {
              return Promise.reject(new Error('Please input a valid amount'));
            }
            if (olasBalance && value > Number(olasBalance)) {
              return Promise.reject(new Error('Amount cannot be greater than the balance'));
            }
            return Promise.resolve();
          },
        }),
      ]}
    >
      <InputNumber className="full-width" placeholder="Enter amount" />
    </Form.Item>
  );
};
