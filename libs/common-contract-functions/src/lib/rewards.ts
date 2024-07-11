import { Contract, Provider, ethers } from 'ethers';

const UNIT_TYPES = { COMPONENT: '0', AGENT: '1' } as const;
const BIG_INT_ZERO = BigInt(0);
const BIG_INT_HUNDRED = BigInt(100);

const fixTo8DecimalPlaces = (value: number | string) => {
  const numeralValue = Number(value);
  if (Number.isNaN(numeralValue)) return '0';
  return numeralValue > 0 ? numeralValue.toFixed(8) : '0';
};

const getEpochCounter = async (contract: Contract) => {
  const response = await contract.epochCounter();
  return parseInt(response, 10);
};

const getEpochDetails = async (provider: Provider, contract: Contract) => {
  const epCounter = await getEpochCounter(contract);

  // epoch tokenomics
  const epTokenomics = await contract.mapEpochTokenomics(Number(epCounter) - 1);

  // epoch length
  const epochLenInStr = await contract.epochLen();
  const epochLen = parseInt(epochLenInStr, 10);

  // get the block number and timestamp
  const blockNumber = await provider.getBlockNumber();
  const blockTimestamp = (await provider.getBlock(blockNumber))?.timestamp || 0;
  const timeDiff = blockTimestamp - epTokenomics.endTime;

  return { timeDiff, epochLen };
};

type MapUnitIncentivesRequestArgs = {
  provider: Provider;
  contract: Contract;
  unitType: string;
  unitId: string;
};

const getMapUnitIncentivesRequest = async ({
  provider,
  contract,
  unitType,
  unitId,
}: MapUnitIncentivesRequestArgs) => {
  const currentEpochCounter = Number(await getEpochCounter(contract));

  // Get the unit points of the last epoch
  const componentInfo = await contract.getUnitPoint(currentEpochCounter, 0);
  const agentInfo = await contract.getUnitPoint(currentEpochCounter, 1);

  const response = await contract.mapUnitIncentives(unitType, unitId);
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
  const isCurrentEpochWithReward =
    currentEpochCounter === Number(lastEpoch) && rewardInBn > BIG_INT_ZERO;

  // if the current epoch is not the last epoch, return 0
  if (!isCurrentEpochWithReward) {
    return {
      pendingRelativeReward: '0.00',
      pendingRelativeTopUp: '0.00',
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
  const componentReward = (
    (rewardInBn * ethers.toBigInt(cRewardFraction)) /
    BIG_INT_HUNDRED
  ).toString();
  const agentReward = (
    (rewardInBn * ethers.toBigInt(aRewardFraction)) /
    BIG_INT_HUNDRED
  ).toString();

  let totalIncentives = ethers.toBigInt(pendingRelativeTopUp);
  let componentTopUp = '0';
  let agentPendingTopUp = '0';

  if (pendingRelativeTopUp > 0) {
    const inflationPerSecond = await contract.inflationPerSecond();
    const inflationPerSecondInBn = ethers.toBigInt(inflationPerSecond);

    const { timeDiff, epochLen } = await getEpochDetails(provider, contract);
    const actualEpochTimeLength = timeDiff > epochLen ? timeDiff : epochLen;

    const epochLength = ethers.toBigInt(actualEpochTimeLength);

    const totalTopUps = inflationPerSecondInBn * epochLength;
    totalIncentives = totalIncentives * totalTopUps;

    const componentSumIncentivesInBn = ethers.toBigInt(cSumUnitTopUpsOLAS) * BIG_INT_HUNDRED;
    const agentSumIncentivesInBn = ethers.toBigInt(aSumUnitTopUpsOLAS) * BIG_INT_HUNDRED;

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

// TODO: unable to import TOKENOMICS from util-contracts as of now
// once the import is fixed, remove provider and contract from the function signature
export const getPendingIncentives = async (
  provider: Provider,
  contract: Contract,
  unitType: string,
  unitId: string,
): Promise<{ reward: string; topUp: string }> => {
  const { pendingRelativeReward, pendingRelativeTopUp } = await getMapUnitIncentivesRequest({
    provider,
    contract,
    unitType,
    unitId,
  });

  return {
    reward: pendingRelativeReward,
    topUp: pendingRelativeTopUp,
  };
};
