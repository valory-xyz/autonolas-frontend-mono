import { Alert, Button, Form, InputNumber, Table, Typography } from 'antd';
import { isNumber } from 'lodash';
import pDebounce from 'p-debounce';
import { useState } from 'react';

import { notifyError, getCommaSeparatedNumber } from 'libs/util-functions/src';

import { NA } from 'libs/util-constants/src';
import { useSvmConnectivity } from 'common-util/hooks/useSvmConnectivity';

import { SVM_AMOUNT_DIVISOR } from './constants';
import { useWsolDeposit } from './hooks/useWsolDeposit';
import { DEFAULT_SLIPPAGE, slippageValidator } from './utils';

const { Text } = Typography;

export const WsolDeposit = () => {
  const [form] = Form.useForm();
  const { isSvmWalletConnected } = useSvmConnectivity();
  const [estimatedQuote, setEstimatedQuote] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [quoteLiquidity, setQuoteLiquidity] = useState(null);

  const {
    getDepositIncreaseLiquidityQuote: fn,
    getDepositTransformedQuote,
    deposit,
    bridgedTokenAmount,
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

      const quoteLiquidityAmount = await deposit({ slippage, sol });
      setQuoteLiquidity(quoteLiquidityAmount / SVM_AMOUNT_DIVISOR);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDepositing(false);
    }
  };

  const isDepositButtonDisabled = isEstimating || isDepositing || !isSvmWalletConnected;
  const estimatedOutput =
    getCommaSeparatedNumber((estimatedQuote?.liquidity || 0) / SVM_AMOUNT_DIVISOR) || NA;
  const bridgedTokenAmountValue = bridgedTokenAmount
    ? getCommaSeparatedNumber(bridgedTokenAmount)
    : NA;

  return (
    <>
      <Form form={form} name="manage" layout="vertical" className="mt-16" onFinish={handleDeposit}>
        <Form.Item
          name="sol"
          label="SOL (WSOL)"
          rules={[{ required: true, message: 'Please input a valid amount of SOL' }]}
          extra="The amount of SOL or WSOL, whichever is greater."
        >
          <InputNumber min={0} className="full-width" onChange={onWsolAndSlippageChange} />
        </Form.Item>

        <Form.Item
          name="olas"
          label="Max OLAS"
          rules={[{ required: true, message: 'Please input a valid amount of OLAS' }]}
          extra="The max amount of OLAS accounting for the slippage value."
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
          <Table
            columns={[
              {
                title: 'Estimated LP amount',
                dataIndex: 'estimatedLpAmount',
                width: '50%',
              },
              {
                title: 'Current LP balance',
                dataIndex: 'currentLpBalance',
                width: '50%',
              },
            ]}
            dataSource={[
              {
                key: '1',
                estimatedLpAmount: `${estimatedOutput} WSOL-OLAS`,
                currentLpBalance: `${bridgedTokenAmountValue} WSOL-OLAS`,
              },
            ]}
            bordered
            loading={isEstimating}
            rowHoverable={false}
            pagination={false}
            style={{ width: '100%' }}
            className="mb-16"
          />

          <Button
            size="large"
            type="primary"
            htmlType="submit"
            loading={isDepositing}
            disabled={isDepositButtonDisabled}
          >
            Deposit
          </Button>
        </Form.Item>
      </Form>

      {quoteLiquidity ? (
        <Alert
          message={
            <>
              You received
              <Text strong>{` ${getCommaSeparatedNumber(quoteLiquidity)} WSOL-OLAS`}</Text>
            </>
          }
          type="success"
          showIcon
        />
      ) : null}
    </>
  );
};
