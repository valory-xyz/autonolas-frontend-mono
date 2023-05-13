import { ethers } from 'ethers';
import { formatToEth } from 'common-util/functions';

export const getNextReleasableAmount = (lockedBalance, timestamp) => {
  const STEP_TIME = 365 * 86400;
  let buolasNextReleasableTime = null;
  let buolasNextReleasableAmount = null;

  const startTime = Number(lockedBalance.startTime);
  const endTime = Number(lockedBalance.endTime);

  if (endTime > 0) {
    const totalNumSteps = ((endTime - startTime) / STEP_TIME);
    const releasedSteps = ((timestamp - startTime) / STEP_TIME);
    const numNextStep = releasedSteps + 1;
    buolasNextReleasableTime = (startTime + STEP_TIME * numNextStep);

    if (numNextStep >= totalNumSteps) {
      buolasNextReleasableAmount = lockedBalance.totalAmount - lockedBalance.transferredAmount;
    } else {
      /**
       * divide the total amount by the number of steps
       *
       * example:
       * amount = 1000
       * steps = 4
       * nextReleasableAmount = 1000 / 4 = 250
       */
      buolasNextReleasableAmount = (lockedBalance.totalAmount) / totalNumSteps;
    }

    // convert to display format
    // multiplied by 1000 to convert to milliseconds
    buolasNextReleasableTime *= 1000;
    // format to eth for display
    buolasNextReleasableAmount = formatToEth(ethers.BigNumber.from(`${buolasNextReleasableAmount}`));
  }

  return {
    buolasNextReleasableTime,
    buolasNextReleasableAmount,
  };
};
