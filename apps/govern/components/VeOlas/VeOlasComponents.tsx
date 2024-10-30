import {
  formatWeiNumber,
  getCommaSeparatedNumber,
  getFormattedDate,
  getFullFormattedDate,
} from 'common-util/functions';

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

export const BalanceComponent = ({
  isLoading,
  olasBalance,
}: {
  isLoading: boolean;
  olasBalance: string | undefined;
}) => (
  <InfoCard
    isLoading={isLoading}
    title="OLAS balance"
    value={formatWeiNumber({ value: olasBalance, maximumFractionDigits: 3 })}
    tooltipValue={getCommaSeparatedNumber(olasBalance)}
  />
);

export const VotingPowerComponent = ({
  isLoading,
  votingPower,
}: {
  isLoading: boolean;
  votingPower: string | undefined;
}) => (
  <InfoCard
    isLoading={isLoading}
    title="Voting power"
    value={formatWeiNumber({ value: votingPower })}
    tooltipValue={getCommaSeparatedNumber(votingPower)}
  />
);

export const VotingPercentComponent = ({
  isLoading,
  votingPower,
  totalSupply,
}: {
  isLoading: boolean;
  votingPower: string | undefined;
  totalSupply: string | undefined;
}) => (
  <InfoCard
    isLoading={isLoading}
    title="% of total voting power"
    value={
      votingPower === undefined || Number(votingPower) === 0 || Number(totalSupply) === 0
        ? '0%'
        : `${getTotalVotesPercentage(votingPower, totalSupply)}%`
    }
  />
);

export const LockedAmountComponent = ({
  isLoading,
  veOlasBalance,
}: {
  isLoading: boolean;
  veOlasBalance: string | undefined;
}) => (
  <InfoCard
    isLoading={isLoading}
    title="Current locked OLAS"
    value={formatWeiNumber({ value: veOlasBalance, maximumFractionDigits: 3 })}
    tooltipValue={getCommaSeparatedNumber(veOlasBalance)}
  />
);

export const UnlockTimeComponent = ({
  isLoading,
  lockedEnd,
}: {
  isLoading: boolean;
  lockedEnd: number | undefined;
}) => (
  <InfoCard
    isLoading={isLoading}
    title="Current unlock date"
    value={getFormattedDate(Number(lockedEnd))}
    tooltipValue={getFullFormattedDate(Number(lockedEnd))}
  />
);

export const UnlockedAmountComponent = ({
  isLoading,
  veOlasBalance,
  canWithdrawVeolas,
}: {
  isLoading: boolean;
  veOlasBalance: string | undefined;
  canWithdrawVeolas: boolean;
}) => {
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
