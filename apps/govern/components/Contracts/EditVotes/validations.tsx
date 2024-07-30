import { Flex, Typography, notification } from 'antd';
import { Allocation } from 'types';
import { Address } from 'viem';

import {
  checkIfContractDisabled,
  checkIfNomineeRemoved,
  checkLockExpired,
  checkNegativeSlope,
} from 'common-util/functions/requests';

const { Paragraph } = Typography;

const getRemovedNomineesError = (removedNominees: Address[], allocations: Allocation[]) => (
  <Flex align="start" vertical>
    <Paragraph className="m-0">Some contracts are no longer available for voting.</Paragraph>
    <Paragraph>Remove them and try again:</Paragraph>
    <ul className="m-0 p-0">
      {removedNominees.map((item) => (
        <li key={item}>
          {allocations.find((contract) => contract.address === item)?.metadata.name}
        </li>
      ))}
    </ul>
  </Flex>
);

const NO_veOLAS_ERROR = `You don't have enough veOLAS to vote`;

// Checks if any of the nominees were removed from voting
export const checkNoRemovedNominees = async (allocations: Allocation[]) => {
  const removedNominees = await checkIfNomineeRemoved(allocations);
  if (removedNominees.length > 0) {
    notification.error({
      message: getRemovedNomineesError([allocations[0].address], allocations),
      duration: 10,
    });
    return false;
  }

  return true;
};

// Checks if any of the nominated contracts are disabled
export const checkNoDisabledContracts = async (allocations: Allocation[]) => {
  const disabledContracts = await checkIfContractDisabled(allocations);
  if (disabledContracts.length > 0) {
    notification.error({
      message: getRemovedNomineesError(disabledContracts, allocations),
      duration: 10,
    });
    return false;
  }

  return true;
};

// Check not negative slope
export const checkNotNegativeSlope = async (account: Address) => {
  const isNegativeSlope = await checkNegativeSlope(account);
  if (isNegativeSlope) {
    notification.error({ message: NO_veOLAS_ERROR });
    return false;
  }

  return true;
};

// Check lock not expired
export const checkLockNotExpired = async (account: Address) => {
  const isLockExpired = await checkLockExpired(account);
  if (isLockExpired) {
    notification.error({ message: NO_veOLAS_ERROR });
    return false;
  }

  return true;
};
