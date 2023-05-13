/* eslint-disable react/prop-types */
import dayjs from 'dayjs';
import {
  Form, InputNumber, DatePicker, Button, Typography,
} from 'antd/lib';
import { range, isNil } from 'lodash';
import { Shimmer } from 'common-util/Shimmer';
import { getCommaSeparatedNumber } from 'common-util/functions';
import { useFetchBalances } from './Registry/hooks';

const { Text } = Typography;

const fullWidth = { width: '100%' };

export const getToken = ({ tokenName, token, isLoading = false }) => (
  <div className={`section ${tokenName}-section`}>
    <div className="info">
      <span className="token-name">{tokenName}</span>
      <span className="balance">
        <>{isLoading ? <Shimmer /> : <>{token || '--'}</>}</>
      </span>
    </div>
  </div>
);

/**
 * Parses to seconds by doing the following operation in order
 * 1. convert to milliseconds
 * 2. divide by 100 to convert to seconds
 * 3. remove decimals
 */
export const parseToSeconds = (unlockTime) => {
  const futureDateInTimeStamp = Math.round(
    new Date(unlockTime).getTime() / 1000,
  );
  const todayDateInTimeStamp = Math.round(new Date().getTime() / 1000);
  return futureDateInTimeStamp - todayDateInTimeStamp;
};

/**
 * @returns Amount Input
 */
export const FormItemInputNumber = ({ text = 'Lock OLAS' }) => {
  const { olasBalanceInEth } = useFetchBalances();

  return (
    <Form.Item
      className="custom-form-item-lock"
      name="amount"
      label={text}
      rules={[
        { required: true, message: 'Amount is required' },
        () => ({
          validator(_, value) {
            if (value === '' || isNil(value)) return Promise.resolve();
            if (value <= 1) {
              return Promise.reject(new Error('Please input a valid amount'));
            }
            if (olasBalanceInEth && value > olasBalanceInEth) {
              return Promise.reject(
                new Error('Amount cannot be greater than the balance'),
              );
            }
            return Promise.resolve();
          },
        }),
      ]}
    >
      <InputNumber style={fullWidth} placeholder="Add amount" />
    </Form.Item>
  );
};

export const MaxButton = ({ onMaxClick }) => {
  const { olasBalanceInEth } = useFetchBalances();

  return (
    <Text type="secondary">
      OLAS balance:&nbsp;
      {getCommaSeparatedNumber(olasBalanceInEth)}
      <Button
        htmlType="button"
        type="link"
        onClick={onMaxClick}
        className="pl-0"
      >
        Max
      </Button>
    </Text>
  );
};

/**
 * @returns Date Input
 * @param {Date} startDate - start date from when the user can select the date
 * and startDate cannot be less than today.
 *
 * eg. If increased amount to 5th March 2023 and the current date is 20th Janurary 2023
 * then the user can select ONLY from the date from 5th March 2023
 */
export const FormItemDate = ({ startDate }) => {
  const tempStartDate = startDate ? new Date(startDate) : new Date();
  /**
   * (can select days after 7 days from today OR
   * can select from [startDate + 7 days]) AND
   * less than 4 years from today
   */
  const disableDateForUnlockTime = (current) => {
    const pastDate = current < dayjs(tempStartDate).add(6, 'days').endOf('day');

    /**
     * if the current date is 4th May 2023 (Thursday),
     * the user can select only same day in future
     * ie. 11th May 2023, 18th May 2023, 25th May 2023 and so on
     */
    const notSameDayInFuture = dayjs(current).day() !== dayjs().day();

    // do not allow selection for more than 4 years
    const futureDate = current > dayjs().add(4, 'years');
    return (current && pastDate) || futureDate || notSameDayInFuture;
  };

  return (
    <Form.Item
      name="unlockTime"
      label="Unlock Time"
      rules={[{ required: true, message: 'Unlock Time is required' }]}
      tooltip="The date should be minimum 1 week and maximum 4 years"
    >
      <DatePicker
        disabledDate={disableDateForUnlockTime}
        disabledTime={() => {
          const currentHour = dayjs().hour();
          const currentMinute = dayjs().minute();

          return {
            disabledHours: () => range(0, currentHour).map((i) => i),
            disabledMinutes: () => range(0, currentMinute).map((i) => i),
          };
        }}
        format="MM/DD/YYYY HH:mm"
        style={fullWidth}
        showTime={{ format: 'HH:mm' }}
      />
    </Form.Item>
  );
};
