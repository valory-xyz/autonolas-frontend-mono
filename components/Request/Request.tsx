import { WaitForTransactionReceiptReturnType } from '@wagmi/core';
import { Alert, Button, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { AGENT_MECH_ABI } from 'common-util/AbiAndAddresses';
import { getContract, getMarketplaceContract } from 'common-util/Contracts';
import { getAgentHash, getChainId, getIpfsResponse } from 'common-util/functions';
import { checkAndApproveToken, getAgentHashes, getTokenId } from 'common-util/functions/requests';
import { PAYMENT_TYPES, SCAN_URLS, UNICODE_SYMBOLS } from 'util/constants';

import { FormValues, RequestForm } from './RequestForm/RequestForm';
import { RequestFormLegacy } from './RequestForm/RequestFormLegacy';
import {
  getBalanceTrackerContract,
  getBalanceTrackerToken,
  sendMarketplaceRequest,
} from './requests';

type RequestProps = {
  mechAddress: string;
};

/** @deprecated */
export const LegacyRequest = ({ mechAddress }: RequestProps) => {
  // @ts-ignore TODO: add types
  const { account } = useSelector((state) => state?.setup);
  const [dataList, setDataList] = useState<any[]>([]);
  const [information, setInformation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const hash = router?.query?.hash as string | undefined;

  const mechContract = useMemo(() => {
    return getContract(AGENT_MECH_ABI, mechAddress);
  }, [mechAddress]);

  useEffect(() => {
    if (!mechContract) return;

    const getIpfsDetailsFromHash = async (agentHash: string) => {
      const data = await getIpfsResponse(agentHash);
      setDataList(data.tools || []);
    };

    const getIpfsDetailsFromId = async () => {
      const agentId = await getTokenId(mechContract);
      const agentDetails = await getAgentHashes(agentId);
      const currentHash = getAgentHash(agentDetails.agentHashes);

      if (!currentHash) {
        throw new Error('Unable to get agent Hash');
      }
      await getIpfsDetailsFromHash(currentHash);
    };

    if (hash) {
      getIpfsDetailsFromHash(hash);
    } else {
      getIpfsDetailsFromId();
    }
  }, [hash, mechContract]);

  const handleSubmit = async (values: { hash: string }, onSuccess: () => void) => {
    if (account && mechContract) {
      setInformation(null);
      setIsLoading(true);

      try {
        const price = await mechContract.methods.price().call();

        await mechContract.methods
          .request(`0x${values.hash}`)
          .send({ from: account, value: price })
          .then((result: any) => {
            onSuccess();
            setInformation(result);
            notification.success({
              message: 'Transaction executed',
              description: 'Delivery may take several seconds.',
            });
          });
      } catch (e: any) {
        notification.error({ message: 'Transaction failed', description: e.message });
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div>
        <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
          New request
        </Button>
      </div>

      <RequestFormLegacy
        visible={isModalVisible}
        tools={dataList}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      />
      {information && (
        <Alert
          message={'Request successfully'}
          type="success"
          data-testid="alert-info-container"
          showIcon
        />
      )}
    </>
  );
};

export const MarketplaceRequest = ({ mechAddresses }: { mechAddresses: string[] }) => {
  // @ts-ignore TODO: add types
  const { account } = useSelector((state) => state?.setup);
  const [txnHash, setTxnHash] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSubmit = async (
    values: FormValues & { hash: string; paymentType: `0x${string}` },
    onSuccess: () => void,
  ) => {
    if (account) {
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
      } catch (e: any) {
        notification.error({ message: 'Transaction failed', description: e.message });
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div>
        <Button type="primary" ghost onClick={() => setIsModalVisible(true)}>
          New request
        </Button>
      </div>

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
          showIcon
        />
      )}
    </>
  );
};

export const Request = ({ mechAddress, isLegacy }: RequestProps & { isLegacy: boolean }) => {
  if (!mechAddress) return null;
  if (isLegacy) return <LegacyRequest mechAddress={mechAddress} />;

  return <MarketplaceRequest mechAddresses={[mechAddress]} />;
};
