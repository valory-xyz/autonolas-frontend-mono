import {
  formatWeiNumber,
  getCommaSeparatedNumber,
  getFormattedDate,
  getFullFormattedDate,
} from 'common-util/functions';
import { useFetchBalances } from 'hooks/useFetchBalances';

import { InfoCard } from './InfoCard';

const getTotalVotesPercentage = (
  votingPower: string | undefined,
  totalSupply: string | undefined,
) => {
  if (votingPower && totalSupply) {
    const votingPowerInPercentage = ((Number(votingPower) / Number(totalSupply)) * 100).toFixed(2);
    return formatWeiNumber({ value: votingPowerInPercentage });
  }

  return null;
};

/**
 * This hook is used to get the components
 */
export const useVeolasComponents = () => {
  const {
    isLoading,
    olasBalance,
    veOlasBalance,
    votingPower,
    totalSupply,
    lockedEnd,
    canWithdrawVeolas,
  } = useFetchBalances();

  const getBalanceComponent = () => (
    <InfoCard
      isLoading={isLoading}
      title="OLAS balance"
      value={formatWeiNumber({ value: olasBalance, maximumFractionDigits: 3 })}
      tooltipValue={getCommaSeparatedNumber(olasBalance)}
    />
  );

  const getVotingPowerComponent = () => (
    <InfoCard
      isLoading={isLoading}
      title="Voting power"
      value={formatWeiNumber({ value: votingPower })}
      tooltipValue={getCommaSeparatedNumber(votingPower)}
    />
  );

  const getVotingPercentComponent = () => (
    <InfoCard
      isLoading={isLoading}
      title="% of total voting power"
      value={
        Number(votingPower) === 0 || Number(totalSupply) === 0
          ? '0%'
          : `${getTotalVotesPercentage(votingPower, totalSupply)}%`
      }
    />
  );

  const getLockedAmountComponent = () => (
    <InfoCard
      isLoading={isLoading}
      title="Current locked OLAS"
      value={formatWeiNumber({ value: veOlasBalance, maximumFractionDigits: 3 })}
      tooltipValue={getCommaSeparatedNumber(veOlasBalance)}
    />
  );

  const getUnlockTimeComponent = () => (
    <InfoCard
      isLoading={isLoading}
      title="Current unlock date"
      value={getFormattedDate(Number(lockedEnd))}
      tooltipValue={getFullFormattedDate(Number(lockedEnd))}
    />
  );

  // unlocked OLAS = balanceOf(amount) of veOlas contract
  const getUnlockedAmountComponent = () => {
    // if the user has no locked OLAS, then don't show the component
    if (!canWithdrawVeolas) return null;
    return (
      <InfoCard
        isLoading={isLoading}
        title="Unlocked OLAS"
        value={formatWeiNumber({ value: veOlasBalance, maximumFractionDigits: 3 })}
        tooltipValue={getCommaSeparatedNumber(veOlasBalance)}
      />
    );
  };

  return {
    getBalanceComponent,
    getVotingPowerComponent,
    getVotingPercentComponent,
    getLockedAmountComponent,
    getUnlockTimeComponent,
    getUnlockedAmountComponent,
  };
};
