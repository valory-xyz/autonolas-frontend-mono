import { Alert, Button, notification } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { AGENT_MECH_ABI } from 'common-util/AbiAndAddresses';
import { getContract, getMarketplaceContract } from 'common-util/Contracts';
import { getAgentHash, getIpfsResponse } from 'common-util/functions';
import { getAgentHashes, getTokenId } from 'common-util/functions/requests';
import { PAYMENT_TYPES } from 'util/constants';

import { FormValues, RequestForm } from './RequestForm/RequestForm';
import { RequestFormLegacy } from './RequestForm/RequestFormLegacy';

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
  const [information, setInformation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSubmit = async (
    values: FormValues & { hash: string; paymentType: string },
    onSuccess: () => void,
  ) => {
    if (account) {
      setInformation(null);
      setIsLoading(true);

      try {
        const payment = PAYMENT_TYPES[values.paymentType];

        if (!payment) {
          throw new Error(
            `Could not define payment configuration for payment type: ${values.paymentType}`,
          );
        }

        const marketplaceContract = getMarketplaceContract();

        let value: undefined | string = values.maxDeliveryRate;
        if (payment.isNVM) {
          // Deposit is not allowed for NVM
          value = undefined;
        }

        // if (payment.isToken) {
        //   // Need to approve token before proceeding with request
        //   const balanceTrackerContract = await marketplaceContract.methods
        //     .mapPaymentTypeBalanceTrackers(values.paymentType)
        //     .call();

        //   const tokenToApprove = '';
        //   let valueToApprove = values.maxDeliveryRate;
        //   // TODO: check and approve
        // }

        // TODO: use gas estimation
        await marketplaceContract.methods
          .request(
            `0x${values.hash}`,
            values.maxDeliveryRate,
            values.paymentType,
            values.mechAddress,
            values.responseTimeout,
            '0x',
          )
          .send({ from: account, value })
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

      <RequestForm
        visible={isModalVisible}
        mechAddresses={mechAddresses}
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

export const Request = ({ mechAddress, isLegacy }: RequestProps & { isLegacy: boolean }) => {
  if (!mechAddress) return null;
  if (isLegacy) return <LegacyRequest mechAddress={mechAddress} />;

  return <MarketplaceRequest mechAddresses={[mechAddress]} />;
};
