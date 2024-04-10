import { FC, useEffect, useState } from 'react';
import { Form, FormInstance, Input } from 'antd';

/**
 * validates the threshold based on the no. of slots
 */
const validateThreshold = (
  agentNumSlots: string | undefined,
  thresholdValue: string | undefined,
) => {
  if (!thresholdValue && !agentNumSlots) return Promise.resolve();

  if (thresholdValue?.includes('/')) {
    return Promise.reject();
  }

  // eg: 1, 2, 1 and sumOfSlots = 4
  const sumOfSlots = agentNumSlots
    ? agentNumSlots
        .split(',')
        .reduce((sum: number, num: string) => sum + parseInt(num.trim(), 10), 0)
    : 0;

  // eg: 2/3 * 4 = 2.66
  // Now, threshold should be at least 2.66 and not exceed the sum of no. of slots
  // ie. threshold >= 2.66 && threshold <= 4
  const threshold = parseInt(thresholdValue || '0', 10);

  if (threshold >= (2 / 3) * sumOfSlots && threshold <= sumOfSlots) {
    return Promise.resolve();
  }

  return Promise.reject(
    new Error(
      'Threshold must be at least 2/3 and not exceed the sum of no. of slots',
    ),
  );
};

type ThresholdInputProps = { form: FormInstance };

const DEFAULT_THRESHOLD_HELP =
  'Threshold must be at least 2/3 the sum of no. of slots and not exceed the sum of no. of slots';

export const ThresholdInput: FC<ThresholdInputProps> = ({ form }) => {
  const [help, setHelp] = useState(DEFAULT_THRESHOLD_HELP);
  const rawThresholdValue = Form.useWatch('threshold', form);

  useEffect(() => {
    if (!rawThresholdValue) return;

    if (rawThresholdValue.includes('/')) {
      setHelp('Enter threshold as a single number e.g. 3');
    } else if (help !== DEFAULT_THRESHOLD_HELP) {
      setHelp(DEFAULT_THRESHOLD_HELP);
    }
  }, [help, rawThresholdValue]);

  return (
    <Form.Item
      label="Threshold"
      name="threshold"
      help={help}
      rules={[
        { required: true, message: 'Please input the threshold' },
        () => {
          const agentNumSlots = form.getFieldValue('agent_num_slots');
          return {
            validator(_, value) {
              return validateThreshold(agentNumSlots, value);
            },
          };
        },
      ]}
    >
      <Input placeholder="3" />
    </Form.Item>
  );
};
