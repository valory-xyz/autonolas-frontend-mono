import { notifyError } from '@autonolas/frontend-library';

import isObject from 'lodash/isObject';

const getErrorMessage = (error) => {
  if (!isObject(error)) {
    return error || 'Some error occurred';
  }

  if ((error?.message || '').includes('OwnerOnly')) {
    return 'You are not the owner of the component/agent';
  }
  if ((error?.message || '').includes('WrongUnitId')) {
    return 'Unit ID is not valid';
  }
  if ((error?.message || '').includes('ClaimIncentivesFailed')) {
    return 'You do not have any rewards to claim';
  }
  if ((error?.message || '').includes('TransferFailed')) {
    return 'Transfer failed';
  }
  if ((error?.message || '').includes('execution reverted')) {
    return 'Nothing to claim for the connected wallet';
  }
  return error?.message || 'Some error occurred';
};

export const getErrorDescription = (desc) => {
  // don't show error if it is due to compute units
  if ((desc || '').includes('app has exceeded its compute units ')) {
    return null;
  }

  return desc;
};

export const notifySpecificError = (error, desc) => {
  const message = getErrorMessage(error);
  const description = getErrorDescription(desc);
  notifyError(message, description);
};
