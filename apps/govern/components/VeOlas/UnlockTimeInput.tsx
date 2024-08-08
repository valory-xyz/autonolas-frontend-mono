import { DatePicker, DatePickerProps, Form, Typography } from 'antd';
import range from 'lodash/range';
import React from 'react';

const { Text } = Typography;

type UnlockTimeInputProps = {
  startDate?: number;
};

// Helper function to add days to a date
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const UnlockTimeInput = ({ startDate }: UnlockTimeInputProps) => {
  const tempStartDate = startDate ? new Date(startDate) : new Date();

  // Function to disable specific dates
  const disableDateForUnlockTime: DatePickerProps['disabledDate'] = (current) => {
    const currentDate = current.toDate();
    const today = new Date();
    const sevenDaysFromTempStartDate = addDays(tempStartDate, 6);
    const fourYearsFromToday = addDays(today, 4 * 365);

    const pastDate = currentDate < sevenDaysFromTempStartDate;
    const notSameDayInFuture = currentDate.getDay() !== today.getDay();
    const futureDate = currentDate > fourYearsFromToday;

    return pastDate || notSameDayInFuture || futureDate;
  };

  return (
    <Form.Item
      name="unlockTime"
      label={<Text type="secondary">Unlock date and time</Text>}
      rules={[{ required: true, message: 'Unlock Time is required' }]}
      tooltip="The date should be minimum 1 week and maximum 4 years"
      className="mb-4"
    >
      <DatePicker
        disabledDate={disableDateForUnlockTime}
        disabledTime={() => {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          return {
            disabledHours: () => range(0, currentHour),
            disabledMinutes: () => range(0, currentMinute),
          };
        }}
        format="MM/DD/YYYY HH:mm"
        className="full-width"
        showTime={{ format: 'HH:mm' }}
        size="large"
      />
    </Form.Item>
  );
};
