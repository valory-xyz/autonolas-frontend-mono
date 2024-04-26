import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, InputNumber, Spin } from 'antd';
import pDebounce from 'p-debounce';
import { isNil, isNumber } from 'lodash';
import { notifyError } from '@autonolas/frontend-library';

import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';
import { useWsolWithdraw } from './hooks/useWsolWithdraw';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';
import { SVM_AMOUNT_DIVISOR } from './constants';

export const WsolWithDraw = () => {
  const [form] = Form.useForm();
  const [isEstimating, setIsEstimating] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [maxAmount, setMaxAmount] = useState(0);

  const { isSvmWalletConnected } = useSvmConnectivity();
  const {
    withdrawDecreaseLiquidityQuote: fn,
    withdrawTransformedQuote,
    withdraw,
    getMaxAmount,
  } = useWsolWithdraw();
  const getDecreaseLiquidityQuote = pDebounce(fn, 500);

  const updateMaxAmount = useCallback(() => {
    const setMaxAmountFn = async () => {
      const tempAmount = await getMaxAmount();
      if (!isNil(tempAmount)) {
        setMaxAmount(tempAmount / SVM_AMOUNT_DIVISOR);
      }
    };

    if (isSvmWalletConnected) setMaxAmountFn();
  }, [isSvmWalletConnected, getMaxAmount]);

  // set max amount on initial load
  useEffect(() => updateMaxAmount(), [updateMaxAmount]);

  const onAmountAndSlippageChange = useCallback(async () => {
    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');

    if (!isNumber(amount) || !isNumber(slippage)) return;

    try {
      setIsEstimating(true);

      const actualAmount = amount * SVM_AMOUNT_DIVISOR;
      const quote = await getDecreaseLiquidityQuote({
        amount: actualAmount,
        slippage,
      });
      const transformedQuote = await withdrawTransformedQuote(quote);

      // update olas and wsol value
      form.setFieldsValue({
        olas: transformedQuote?.olasMin || null,
        wsol: transformedQuote?.wsolMin || null,
      });
    } catch (error) {
      notifyError('Failed to get estimated quote');
      console.error(error);
    } finally {
      setIsEstimating(false);
    }
  }, [form, getDecreaseLiquidityQuote, withdrawTransformedQuote]);

  const onMaxClick = useCallback(() => {
    form.setFieldsValue({ amount: maxAmount });
    onAmountAndSlippageChange();
  }, [form, maxAmount, onAmountAndSlippageChange]);

  const handleWithdraw = useCallback(async () => {
    if (!isSvmWalletConnected) {
      notifyError('Please connect your wallet');
      return;
    }

    const amount = form.getFieldValue('amount');
    const slippage = form.getFieldValue('slippage');
    if (amount > maxAmount) {
      notifyError('Amount exceeds the maximum limit');
      return;
    }

    try {
      setIsWithdrawing(true);

      const actualAmount = amount * SVM_AMOUNT_DIVISOR;
      await withdraw({ amount: actualAmount, slippage });

      // reset form fields after successful withdraw
      form.resetFields();

      // re-fetch max amount
      updateMaxAmount();
    } catch (error) {
      console.error(error);
    } finally {
      setIsWithdrawing(false);
    }
  }, [form, maxAmount, updateMaxAmount, withdraw, isSvmWalletConnected]);

  const isMaxButtonDisabled = useMemo(
    () => isEstimating || isWithdrawing || !isSvmWalletConnected,
    [isEstimating, isWithdrawing, isSvmWalletConnected],
  );
  const isWithdrawButtonDisabled = useMemo(
    () => isEstimating || isWithdrawing || !isSvmWalletConnected,
    [isEstimating, isWithdrawing, isSvmWalletConnected],
  );

  return (
    <Form
      form={form}
      name="withdraw-form"
      layout="vertical"
      className="mt-16"
      onFinish={handleWithdraw}
    >
      <Form.Item
        name="amount"
        rules={[
          { required: true, message: 'Please input a valid amount' },
          {
            validator: (_, value) => {
              if (!isSvmWalletConnected) return Promise.resolve();

              if (value > maxAmount) {
                return Promise.reject(
                  new Error('Amount cannot exceed the maximum limit'),
                );
              }

              return Promise.resolve();
            },
          },
        ]}
        label={
          <>
            WSOL-OLAS LP
            <Button
              size="small"
              type="primary"
              ghost
              className="ml-8"
              disabled={isMaxButtonDisabled}
              onClick={onMaxClick}
            >
              Max
            </Button>
          </>
        }
      >
        <InputNumber
          className="full-width"
          onChange={onAmountAndSlippageChange}
        />
      </Form.Item>

      <Form.Item
        name="slippage"
        label="Slippage"
        initialValue={DEFAULT_SLIPPAGE}
        rules={[
          { required: true, message: 'Please input a valid slippage' },
          { validator: slippageValidator },
        ]}
      >
        <InputNumber
          min={0.01}
          suffix="%"
          className="full-width"
          onChange={onAmountAndSlippageChange}
        />
      </Form.Item>

      <Spin spinning={isEstimating} size="small">
        <Form.Item
          name="olas"
          label="Estimated OLAS"
          rules={[{ required: true, message: 'Please input a valid OLAS' }]}
        >
          <InputNumber disabled className="full-width" />
        </Form.Item>

        <Form.Item
          name="wsol"
          label="Estimated WSOL"
          rules={[{ required: true, message: 'Please input a valid WSOL' }]}
        >
          <InputNumber disabled className="full-width" />
        </Form.Item>
      </Spin>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={isWithdrawing}
          disabled={isWithdrawButtonDisabled}
        >
          Withdraw
        </Button>
      </Form.Item>
    </Form>
  );
};
