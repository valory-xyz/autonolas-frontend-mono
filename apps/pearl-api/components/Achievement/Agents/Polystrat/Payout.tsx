import { AchievementData, AchievementQueryParams } from 'types/achievement';
import { PayoutCard } from '../shared/PayoutCard';

type PayoutProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
  data: AchievementData;
};

export const Payout = ({ logoSrc, data }: PayoutProps) => {
  if (!data) return null;

  return <PayoutCard agentName="Polystrat" venueName="Polymarket" logoSrc={logoSrc} data={data} />;
};
