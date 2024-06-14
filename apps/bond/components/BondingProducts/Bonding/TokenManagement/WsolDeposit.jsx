import { useState } from 'react';
import { Button, Form, InputNumber, Flex, Typography, Spin, Alert } from 'antd';
import pDebounce from 'p-debounce';
import { isNumber } from 'lodash';
import {
  getCommaSeparatedNumber,
  notifyError,
} from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useWsolDeposit } from './hooks/useWsolDeposit';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';
import { SVM_AMOUNT_DIVISOR } from './constants';

const { Text } = Typography;

export const WsolDeposit = () => {
  const [form] = Form.useForm();
  const { isSvmWalletConnected } = useSvmConnectivity();
  const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [bridgedTokenAmount, setBridgedTokenAmount] = useState(null);

  const {
    getDepositIncreaseLiquidityQuote: fn,
    getDepositTransformedQuote,
    deposit,
  } = useWsolDeposit();
  const getDepositQuote = pDebounce(fn, 500);

  const onWsolAndSlippageChange = async () => {
    const sol = form.getFieldValue('sol');
    const slippage = form.getFieldValue('slippage');

    // estimate quote only if sol and slippage are valid
    if (!isNumber(sol) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);

      const quote = await getDepositQuote({ slippage, sol });
      const transformedQuote = await getDepositTransformedQuote(quote);
      setEstimatedQuote(transformedQuote);

      // update olas value in form
      form.setFieldsValue({ olas: transformedQuote?.olasMax || null });
    } catch (error) {
      notifyError('Failed to estimate quote');
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeposit = async () => {
    try {
      setIsDepositing(true);

      const sol = form.getFieldValue('sol');
      const slippage = form.getFieldValue('slippage');

      const bridgedToken = await deposit({ slippage, sol });
      if (Number(bridgedToken) > 0) {
        setBridgedTokenAmount(bridgedToken / SVM_AMOUNT_DIVISOR);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  };

  const isDepositButtonDisabled =
    isEstimating || isDepositing || !isSvmWalletConnected;
  const estimatedOutput =
    getCommaSeparatedNumber(
      (estimatedQuote?.liquidity || 0) / SVM_AMOUNT_DIVISOR,
    ) || '--';

  return (
    <>
      <Form
        form={form}
        name="manage"
        layout="vertical"
        className="mt-16"
        onFinish={handleDeposit}
      >
        <Form.Item
          name="sol"
          label="SOL (WSOL)"
          rules={[
            { required: true, message: 'Please input a valid amount of SOL' },
          ]}
        >
          <InputNumber
            min={0}
            className="full-width"
            onChange={onWsolAndSlippageChange}
          />
        </Form.Item>

        <Form.Item
          name="olas"
          label="OLAS"
          rules={[
            { required: true, message: 'Please input a valid amount of OLAS' },
          ]}
        >
          <InputNumber disabled className="full-width" />
        </Form.Item>

        <Form.Item
          name="slippage"
          label="Slippage"
          initialValue={DEFAULT_SLIPPAGE}
          rules={[
            {
              required: true,
              message: 'Please input a valid amount of slippage',
            },
            { validator: slippageValidator },
          ]}
        >
          <InputNumber
            min={0}
            step={0.01}
            disabled={isEstimating}
            suffix="%"
            className="full-width"
            onChange={onWsolAndSlippageChange}
          />
        </Form.Item>

        <Form.Item>
          <Spin spinning={isEstimating} size="small">
            <Flex vertical gap="small" className="mb-16">
              <Text strong>ESTIMATED OUTPUT</Text>
              <Text>{`${estimatedOutput} WSOL-OLAS LP`}</Text>
            </Flex>
          </Spin>

          <Button
            type="primary"
            htmlType="submit"
            loading={isDepositing}
            disabled={isDepositButtonDisabled}
          >
            Deposit
          </Button>
        </Form.Item>
      </Form>

      {bridgedTokenAmount && (
        <Alert
          message={
            <>
              You received
              <Text strong>
                {` ${getCommaSeparatedNumber(bridgedTokenAmount)} WSOL-OLAS LP`}
              </Text>
            </>
          }
          type="success"
          showIcon
        />
      )}
    </>
  );
};
