import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import {
  Form, InputNumber, Modal, Alert, Button, Typography, Tag,
} from 'antd';
import {
  COLOR,
  notifyError,
  notifySuccess,
  getCommaSeparatedNumber,
} from '@autonolas/frontend-library';

import { parseToWei, parseToEth, ONE_ETH } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  depositRequest,
  hasSufficientTokenRequest,
  approveRequest,
  getLpBalanceRequest,
} from './requests';

const { Text } = Typography;
const fullWidth = { width: '100%' };

export const Deposit = ({
  productId,
  productToken,
  productLpPrice,
  productSupply,
  getProducts,
  closeModal,
}) => {
  const { account, chainId } = useHelpers();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [lpBalance, setLpBalance] = useState(0);

  useEffect(() => {
    const getData = async () => {
      try {
        const lpResponse = await getLpBalanceRequest({
          account,
          token: productToken,
        });

        setLpBalance(lpResponse);
      } catch (error) {
        notifyError('Error occured on fetching LP balance');
        console.error(error);
      }
    };

    if (account) {
      getData();
    }
  }, [account, productToken]);

  const depositHelper = async () => {
    try {
      setIsLoading(true);

      // deposit if LP token is present for the product ID
      const txHash = await depositRequest({
        account,
        productId,
        tokenAmount: parseToWei(form.getFieldValue('tokenAmount')),
      });
      notifySuccess('Deposited successfully!', `Transaction Hash: ${txHash}`);

      // fetch the products details again
      getProducts();

      // close the modal after successful deposit
      closeModal();
      form.resetFields();
    } catch (error) {
      notifyError('Error while depositing');
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
            account,
            chainId,
            token: productToken,
            tokenAmount: parseToWei(values.tokenAmount),
          });
          // if allowance in lower than the amount to be deposited, then needs approval
          // eg. If user is depositing 10 OLAS and the allowance is 5, then open the approve modal
          if (hasSufficientAllowance) {
            await depositHelper();
          } else {
            setIsApproveModalVisible(true);
          }
        } catch (error) {
          notifyError(
            `Error occured on fetching allowance for the product token ${productToken}`,
          );
        }
      })
      .catch((info) => {
        window.console.log('Validation Failed:', info);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const tokenAmountInputValue = Form.useWatch('tokenAmount', form);

  const getRemainingLpSupply = () => {
    const supplyInWei = BigNumber.from(productSupply);
    const remainingSupply = supplyInWei.mul(ONE_ETH).div(productLpPrice);
    if (remainingSupply.lt(lpBalance)) return remainingSupply;
    return lpBalance;
  };

  const getRemainingLpSupplyInEth = () => {
    const remainingSupply = getRemainingLpSupply();
    return parseToEth(remainingSupply);
  };

  const getOlasPayout = () => {
    if (
      !tokenAmountInputValue
      || tokenAmountInputValue > getRemainingLpSupplyInEth()
    ) {
      return '--';
    }

    const tokenAmountWei = BigNumber.from(parseToWei(tokenAmountInputValue));
    const olasPayout = tokenAmountInputValue
      ? Number(
        BigNumber.from(productLpPrice)
          .mul(tokenAmountWei)
          .div(ONE_ETH)
          .div(ONE_ETH),
      )
      : 0;
    return getCommaSeparatedNumber(olasPayout, 4);
  };

  const remainingLpSupplyInEth = getRemainingLpSupplyInEth();

  return (
    <>
      <Modal
        open
        title="Bond LP tokens for OLAS"
        okText="Bond"
        okButtonProps={{
          disabled: !account || lpBalance === BigNumber.from(0),
        }}
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
          <Tag color={COLOR.PRIMARY} className="deposit-tag">
            <Text>{`Bonding Product ID: ${productId}`}</Text>
          </Tag>

          <Form.Item
            className="custom-form-item-tokenAmount"
            label="LP Token Amount"
            name="tokenAmount"
            extra="Units are denominated in ETH, not wei"
            rules={[
              { required: true, message: 'Please input a valid amount' },
              () => ({
                validator(_, value) {
                  if (value === '' || isNil(value)) return Promise.resolve();
                  if (value <= 0) {
                    return Promise.reject(
                      new Error('Please input a valid amount'),
                    );
                  }
                  if (value > remainingLpSupplyInEth) {
                    return Promise.reject(
                      new Error('Amount cannot be greater than the balance'),
                    );
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
                htmlType="button"
                type="link"
                onClick={() => {
                  form.setFieldsValue({ tokenAmount: remainingLpSupplyInEth });
                  form.validateFields(['tokenAmount']);
                }}
                className="pl-0"
              >
                Max
              </Button>
            </Text>
          </div>

          <div>
            <Text>{`OLAS Payout: ${getOlasPayout()}`}</Text>
          </div>
        </Form>
      </Modal>

      {isApproveModalVisible && (
        <Modal
          title="Approve OLAS"
          visible={isApproveModalVisible}
          footer={null}
          onCancel={() => setIsApproveModalVisible(false)}
        >
          <Alert
            message="Before depositing to the bonding product, an approval for OLAS is required. Please approve OLAS to proceed."
            type="warning"
          />

          <br />
          <div className="align-right">
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await approveRequest({
                    account,
                    chainId,
                    token: productToken,
                  });

                  // once approved, close the modal and call deposit helper
                  setIsApproveModalVisible(false);
                  await depositHelper();
                } catch (error) {
                  window.console.error(error);
                  setIsApproveModalVisible(false);
                  notifyError('Error while approving OLAS');
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
  productSupply: PropTypes.string,
  productLpPrice: PropTypes.shape({}),
  closeModal: PropTypes.func,
  getProducts: PropTypes.func,
};

Deposit.defaultProps = {
  productId: undefined,
  productToken: null,
  productLpPrice: null,
  productSupply: null,
  closeModal: () => {},
  getProducts: () => {},
};
