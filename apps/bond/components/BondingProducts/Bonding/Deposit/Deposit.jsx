import { Alert, Button, Form, InputNumber, Modal, Tag, Typography } from 'antd';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCommaSeparatedNumber } from '@autonolas/frontend-library';

import { COLOR } from 'libs/ui-theme/src';
import { notifyError, notifySuccess } from 'libs/util-functions/src';

import { ONE_ETH, ONE_ETH_IN_STRING } from 'common-util/constants/numbers';
import {
  notifyCustomErrors,
  parseToEth,
  parseToSol,
  parseToSolDecimals,
  parseToWei,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { isSvmLpAddress } from '../BondingList/useBondingList';
import { useDeposit } from './useDeposit';

const { Text } = Typography;
const fullWidth = { width: '100%' };

export const Deposit = ({
  productId,
  productToken,
  productLpTokenName,
  productLpPriceAfterDiscount,
  productSupply,
  getProducts,
  closeModal,
}) => {
  console.log('Deposit -> productToken', productSupply);
  const { account } = useHelpers();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [lpBalance, setLpBalance] = useState(0n);
  const isSvmProduct = isSvmLpAddress(productToken);

  const { getLpBalanceRequest, depositRequest, approveRequest, hasSufficientTokenRequest } =
    useDeposit();

  useEffect(() => {
    const getData = async () => {
      try {
        const lpResponse = await getLpBalanceRequest({ token: productToken });

        setLpBalance(lpResponse);
      } catch (error) {
        notifyError('Error occurred on fetching LP balance');
        console.error(error);
      }
    };

    if (account) {
      getData();
    }
  }, [account, productToken, getLpBalanceRequest]);

  const getTokenValue = useCallback(
    (value) => {
      return isSvmProduct ? parseToSolDecimals(value) : parseToWei(value);
    },
    [isSvmProduct],
  );

  const depositHelper = async () => {
    try {
      setIsLoading(true);

      // deposit if LP token is present for the product ID
      const txHash = await depositRequest({
        productId,
        tokenAmount: getTokenValue(form.getFieldValue('tokenAmount')),
      });
      notifySuccess('Deposited successfully!', `Transaction Hash: ${txHash}`);

      // fetch the products details again
      await getProducts();

      // close the modal after successful deposit
      closeModal();
      form.resetFields();
    } catch (error) {
      notifyCustomErrors(error, 'Error while depositing');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCreate = () => {
    form
      .validateFields()
      .then(async (values) => {
        // check allowance of the product ID and open approve modal if not approved

        try {
          const hasSufficientAllowance = await hasSufficientTokenRequest({
            token: productToken,
            tokenAmount: getTokenValue(values.tokenAmount),
          });
          // if allowance in lower than the amount to be deposited, then needs approval
          // eg. If user is depositing 10 OLAS and the allowance is 5, then open the approve modal
          if (hasSufficientAllowance) {
            await depositHelper();
          } else {
            setIsApproveModalVisible(true);
          }
        } catch (error) {
          notifyError(`Error ocurred on fetching allowance for the product token ${productToken}`);
        }
      })
      .catch((info) => {
        window.console.log('Validation Failed:', info);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const tokenAmountInputValue = Form.useWatch('tokenAmount', form) || 0;

  const remainingLpSupplyInEth = useMemo(() => {
    const totalProductSupplyInWei = productSupply || 0n;
    const lpBalanceInWei = BigInt(lpBalance);
    const maxRedeemableSupply =
      (totalProductSupplyInWei * ONE_ETH) / BigInt(productLpPriceAfterDiscount);
    const remainingLPSupply =
      maxRedeemableSupply < lpBalanceInWei ? maxRedeemableSupply : lpBalanceInWei;

    return isSvmProduct ? parseToSol(remainingLPSupply) : parseToEth(remainingLPSupply);
  }, [lpBalance, productSupply, productLpPriceAfterDiscount, isSvmProduct]);

  // calculate the OLAS payout based on the token amount input
  const olasPayout = useMemo(() => {
    if (!tokenAmountInputValue || tokenAmountInputValue > remainingLpSupplyInEth) {
      return '--';
    }

    const tokenAmountValue = isSvmProduct
      ? tokenAmountInputValue
      : new BigNumber(parseToWei(tokenAmountInputValue));

    const payoutInBg = new BigNumber(productLpPriceAfterDiscount).multipliedBy(tokenAmountValue);
    const payout = isSvmProduct
      ? payoutInBg.dividedBy(BigNumber(`1${'0'.repeat(28)}`)).toFixed(2)
      : Number(payoutInBg.dividedBy(ONE_ETH_IN_STRING).dividedBy(ONE_ETH_IN_STRING).toFixed(2));

    console.log({
      tokenAmountInputValue,
      remainingLpSupplyInEth,
      productLpPriceAfterDiscount,
      isSvmProduct,
      payout,
    });

    return getCommaSeparatedNumber(payout, 4);
  }, [tokenAmountInputValue, remainingLpSupplyInEth, productLpPriceAfterDiscount, isSvmProduct]);

  return (
    <>
      <Modal
        open
        title="Bond LP tokens for OLAS"
        okText="Bond"
        okButtonProps={{ disabled: !account || lpBalance === 0n }}
        cancelText="Cancel"
        onCancel={closeModal}
        onOk={onCreate}
        confirmLoading={isLoading}
        destroyOnClose
      >
        <Form
          form={form}
          name="create_bond_form"
          layout="vertical"
          autoComplete="off"
          className="mt-16"
        >
          <Tag color={COLOR.PRIMARY} className="deposit-tag mb-12">
            {`Bonding Product ID: ${productId}`}
          </Tag>

          <Form.Item
            className="mb-4"
            label="LP Token Amount"
            name="tokenAmount"
            extra={
              isSvmProduct
                ? 'Units are denominated in 8 decimals'
                : 'Units are denominated in ETH, not wei'
            }
            rules={[
              { required: true, message: 'Please input a valid amount' },
              () => ({
                validator(_, value) {
                  if (value === '' || isNil(value)) return Promise.resolve();
                  if (value <= 0) {
                    return Promise.reject(new Error('Please input a valid amount'));
                  }
                  if (value > remainingLpSupplyInEth) {
                    return Promise.reject(new Error('Amount cannot be greater than the balance'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber style={fullWidth} />
          </Form.Item>

          <div className="mb-8">
            <Text type="secondary">
              LP balance:&nbsp;
              {getCommaSeparatedNumber(remainingLpSupplyInEth, 4)}
              <Button
                size="large"
                htmlType="button"
                type="link"
                onClick={() => {
                  form.setFieldsValue({ tokenAmount: remainingLpSupplyInEth });
                  form.validateFields(['tokenAmount']);
                }}
              >
                Max
              </Button>
            </Text>
          </div>

          <div>
            <Text>{`OLAS Payout: ${olasPayout}`}</Text>
          </div>
        </Form>
      </Modal>

      {isApproveModalVisible && (
        <Modal
          title="Approve OLAS"
          open={isApproveModalVisible}
          footer={null}
          onCancel={() => setIsApproveModalVisible(false)}
        >
          <Alert
            message={`Before depositing to the bonding product, an approval for ${productLpTokenName} is required. Please approve ${productLpTokenName} to proceed.`}
            type="warning"
          />

          <br />
          <div className="text-end">
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              loading={isLoading}
              onClick={async () => {
                if (!account) {
                  notifyError('Please connect your wallet');
                  return;
                }

                try {
                  setIsLoading(true);
                  await approveRequest({
                    token: productToken,
                    amountToApprove: ethers.parseUnits(`${tokenAmountInputValue}`, 'ether'),
                  });

                  // once approved, close the modal and call deposit helper
                  setIsApproveModalVisible(false);
                  await depositHelper();
                } catch (error) {
                  window.console.error(error);
                  setIsApproveModalVisible(false);
                  notifyCustomErrors(error, 'Error while approving OLAS');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Approve
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

Deposit.propTypes = {
  productId: PropTypes.string,
  productToken: PropTypes.string,
  productLpTokenName: PropTypes.string,
  productSupply: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  productLpPriceAfterDiscount: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigInt),
  ]),
  closeModal: PropTypes.func,
  getProducts: PropTypes.func,
};

Deposit.defaultProps = {
  productId: undefined,
  productToken: null,
  productLpTokenName: null,
  productLpPriceAfterDiscount: null,
  productSupply: null,
  closeModal: () => {},
  getProducts: () => {},
};
