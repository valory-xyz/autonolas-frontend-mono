import { Alert, Button, notification } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from 'store/types';
import { getChainId } from 'common-util/functions';
import { checkAndApproveToken } from 'common-util/functions/requests';
import { PAYMENT_TYPES, SCAN_URLS, UNICODE_SYMBOLS } from 'util/constants';

import { FormValues, RequestForm } from './RequestForm/RequestForm';
import {
  getBalanceTrackerContract,
  getBalanceTrackerToken,
  sendMarketplaceRequest,
} from './requests';

export const MarketplaceRequest = ({ mechAddresses }: { mechAddresses: string[] }) => {
  const { account } = useSelector((state: RootState) => state?.setup);
  const [txnHash, setTxnHash] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSubmit = async (
    values: FormValues & { hash: string; paymentType: `0x${string}` },
    onSuccess: () => void,
  ) => {
    if (!account) return;

    setTxnHash(null);
    setIsLoading(true);

    try {
      const payment = PAYMENT_TYPES[values.paymentType];

      if (!payment) {
        console.error(
          `Could not define payment configuration for payment type: ${values.paymentType}`,
        );
        throw new Error('This mech is currently not supported');
      }

      if (payment.isToken) {
        // Need to approve token before proceeding with request
        const addressToApprove = await getBalanceTrackerContract(values.paymentType);
        const tokenToApprove = await getBalanceTrackerToken(addressToApprove);
        const amountToApprove = BigInt(values.maxDeliveryRate);

        await checkAndApproveToken({
          account,
          token: tokenToApprove,
          amountToApprove,
          addressToApprove,
        });
      }

      const hash = await sendMarketplaceRequest({
        requestData: `0x${values.hash}`,
        maxDeliveryRate: BigInt(values.maxDeliveryRate),
        paymentType: values.paymentType,
        priorityMech: values.mechAddress,
        responseTimeout: BigInt(values.responseTimeout),
        paymentData: '0x',
        isNVM: payment.isNVM,
      });

      onSuccess();
      setTxnHash(hash);
      notification.success({
        message: 'Transaction executed',
        description: 'Delivery may take several seconds.',
      });
    } catch (error: unknown) {
      notification.error({
        message: 'Transaction failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
        New request
      </Button>

      <RequestForm
        visible={isModalVisible}
        mechAddresses={mechAddresses}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      />
      {txnHash && (
        <Alert
          message={
            <>
              Request sent successfully. See{' '}
              <a
                href={`${SCAN_URLS[getChainId()]}/tx/${txnHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                txn details {UNICODE_SYMBOLS.EXTERNAL_LINK}
              </a>
            </>
          }
          type="success"
          data-testid="alert-info-container"
          className="mt-8"
          showIcon
        />
      )}
    </div>
  );
};

type RequestProps = {
  mechAddress: string;
  isLegacy: boolean;
};

export const Request = ({ mechAddress, isLegacy }: RequestProps) => {
  if (!mechAddress) return null;

  return <MarketplaceRequest mechAddresses={[mechAddress]} />;
};
