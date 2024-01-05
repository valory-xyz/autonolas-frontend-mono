import { notifyError } from '@autonolas/frontend-library';

import { parseToEth, sendTransaction } from 'common-util/functions';
import {
  getTokenomicsContract,
  getTreasuryContract,
  getServiceContract,
} from 'common-util/Contracts';

export const getServiceDetails = async (id) => {
  const contract = getServiceContract();
  const response = await contract.methods.getService(id).call();
  return response;
};

export const checkServicesNotTerminatedOrNotDeployed = async (ids) => {
  const allServiceDetailsPromise = ids.map((id) => getServiceDetails(id));
  const invalidServiceIds = [];

  try {
    const allServiceDetails = await Promise.all(allServiceDetailsPromise);
    allServiceDetails.forEach((service, index) => {
      if (service.state !== '4' && service.state !== '5') {
        invalidServiceIds.push(ids[index]);
      }
    });
    if (invalidServiceIds.length === 0) {
      return [];
    }

    notifyError(
      'Provided service IDs are not deployed or terminated',
      invalidServiceIds.join(', '),
    );
  } catch (error) {
    notifyError('Error on checking service status');
    throw error;
  }

  return invalidServiceIds;
};

export const depositServiceDonationRequest = async ({
  account,
  serviceIds,
  amounts,
  totalAmount,
}) => {
  const contract = getTreasuryContract();
  try {
    const fn = contract.methods
      .depositServiceDonationsETH(serviceIds, amounts)
      .send({ from: account, value: totalAmount });

    const response = await sendTransaction(fn, account);
    return response?.transactionHash;
  } catch (error) {
    notifyError('Error occured on depositing service donation');
    throw error;
  }
};

export const minAcceptedEthRequest = async () => {
  const contract = getTreasuryContract();
  try {
    const response = await contract.methods.minAcceptedETH().call();
    return response;
  } catch (error) {
    notifyError('Error on fetching min accepted ETH');
    throw error;
  }
};

export const getVeOlasThresholdRequest = async () => {
  const contract = getTokenomicsContract();
  try {
    const response = await contract.methods.veOLASThreshold().call();
    return parseToEth(response);
  } catch (error) {
    notifyError('Error on fetching veOLAS threshold');
    throw error;
  }
};

export const checkpointRequest = async (account) => {
  const contract = getTokenomicsContract();
  try {
    const fn = contract.methods.checkpoint().send({ from: account });

    const response = await sendTransaction(fn, account);
    return response?.transactionHash;
  } catch (error) {
    notifyError('Error – could not start new epoch');
    throw error;
  }
};
