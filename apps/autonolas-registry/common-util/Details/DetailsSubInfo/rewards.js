// TODO: move to common-util

import { getTokenomicsContract as getTokenomicsContractHelper } from 'common-util/Contracts';
import { ethers } from 'ethers';
import { TOKENOMICS } from 'libs/util-contracts/src/lib/abiAndAddresses/tokenomics';

const UNIT_TYPES = {
  COMPONENT: '0',
  AGENT: '1',
};

const fixTo8DecimalPlaces = (value) => {
  const numeralValue = Number(value);
  if (Number.isNaN(numeralValue)) return "0";
  return numeralValue > 0 ? numeralValue.toFixed(8) : "0";
};

const getTokenomicsContract = () => getTokenomicsContractHelper(
  TOKENOMICS.addresses[1],
);

const getBlockTimestamp = async (block = 'latest') => {
  const temp = await window?.WEB3_PROVIDER.eth.getBlock(block);
  return temp.timestamp * 1;
};

const getEpochLength = async () => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.epochLen().call();
  return parseInt(response, 10);
};

const getEpochTokenomics = async (epochNum) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.mapEpochTokenomics(epochNum).call();
  return response;
};

const getEpochDetails = async () => {
  const epCounter = await getEpochCounter();
  const epTokenomics = await getEpochTokenomics(Number(epCounter) - 1);
  const epochLen = await getEpochLength();
  const blockTimestamp = await getBlockTimestamp();
  const timeDiff = blockTimestamp - epTokenomics.endTime;

  return { timeDiff, epochLen };
};

const getActualEpochTimeLength = async () => {
  try {
    const { timeDiff, epochLen } = await getEpochDetails();
    return timeDiff > epochLen ? timeDiff : epochLen;
  } catch (error) {
    console.error(error);
  }

  return 0;
};

const getUnitPointReq = async ({ lastPoint, num }) => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.getUnitPoint(lastPoint, num).call();
  return response;
};

const getEpochCounter = async () => {
  const contract = getTokenomicsContract();
  const response = await contract.methods.epochCounter().call();
  return parseInt(response, 10);
};

export const getMapUnitIncentivesRequest = async ({ unitType, unitId }) => {
  const contract = getTokenomicsContract();

  const response = await contract.methods.mapUnitIncentives(unitType, unitId).call();

  const currentEpochCounter = Number(await getEpochCounter());

  // Get the unit points of the last epoch
  const componentInfo = await getUnitPointReq({
    lastPoint: currentEpochCounter,
    num: 0,
  });

  const agentInfo = await getUnitPointReq({
    lastPoint: currentEpochCounter,
    num: 1,
  });

  // Struct for component / agent incentive balances
  // struct IncentiveBalances {
  //   uint96 reward;                // Reward in ETH [0]
  //   uint96 pendingRelativeReward; // Pending relative reward in ETH [1]
  //   uint96 topUp;                 // Top-up in OLAS [2]
  //   uint96 pendingRelativeTopUp;  // Pending relative top-up [3]
  //   uint32 lastEpoch;             // Last epoch number the information was updated [4]
  // }
  const { pendingRelativeReward, pendingRelativeTopUp, lastEpoch } = response;

  const rewardInBn = ethers.toBigInt(pendingRelativeReward);
  const isCurrentEpochWithReward = currentEpochCounter === Number(lastEpoch) && rewardInBn > 0n;

  console.log({
    isCurrentEpochWithReward,
    currentEpochCounter,
    lastEpoch: Number(lastEpoch),
    rewardInBn,


  });

  // if the current epoch is not the last epoch, return 0
  if (!isCurrentEpochWithReward) {
    return {
      pendingRelativeReward: "0.00",
      pendingRelativeTopUp: "0.00",
    };
  }

  // if the current epoch is the last epoch, calculate the incentives
  const {
    rewardUnitFraction: cRewardFraction,
    topUpUnitFraction: cTopupFraction,
    sumUnitTopUpsOLAS: cSumUnitTopUpsOLAS,
  } = componentInfo;
  const {
    rewardUnitFraction: aRewardFraction,
    topUpUnitFraction: aTopupFraction,
    sumUnitTopUpsOLAS: aSumUnitTopUpsOLAS,
  } = agentInfo;

  /**
   * for unitType agent(0) & component(1),
   * the below calculation is done to get the reward and topup
   */
  const componentReward = ((rewardInBn * ethers.toBigInt(cRewardFraction)) / 100n).toString();
  const agentReward = ((rewardInBn * ethers.toBigInt(aRewardFraction)) / 100n).toString();

  let totalIncentives = ethers.toBigInt(pendingRelativeTopUp);
  let componentTopUp = 0;
  let agentPendingTopUp = 0;

  if (pendingRelativeTopUp > 0) {
    const inflationPerSecond = await contract.methods.inflationPerSecond().call();
    const inflationPerSecondInBn = ethers.toBigInt(inflationPerSecond);
    const epochLength = ethers.toBigInt(await getActualEpochTimeLength());

    const totalTopUps = inflationPerSecondInBn * epochLength;
    totalIncentives = totalIncentives * totalTopUps;

    const componentSumIncentivesInBn = ethers.toBigInt(cSumUnitTopUpsOLAS) * 100n;
    const agentSumIncentivesInBn = ethers.toBigInt(aSumUnitTopUpsOLAS) * 100n;

    componentTopUp = (
      (totalIncentives * ethers.toBigInt(cTopupFraction)) /
      componentSumIncentivesInBn
    ).toString();
    agentPendingTopUp = (
      (totalIncentives * ethers.toBigInt(aTopupFraction)) /
      agentSumIncentivesInBn
    ).toString();
  }

  const pendingRelativeTopUpInEth = ethers.formatEther(
    unitType === UNIT_TYPES.COMPONENT ? componentReward : agentReward,
  );
  const componentTopUpInEth = ethers.formatEther(
    unitType === UNIT_TYPES.COMPONENT ? componentTopUp : agentPendingTopUp,
  );

  return {
    pendingRelativeReward: fixTo8DecimalPlaces(pendingRelativeTopUpInEth),
    pendingRelativeTopUp: fixTo8DecimalPlaces(componentTopUpInEth),
  };
};