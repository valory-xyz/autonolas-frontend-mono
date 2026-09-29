import { AchievementData, AchievementQueryParams } from 'types/achievement';
import { PayoutCard } from '../shared/PayoutCard';

type PayoutProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
  marketImageSrc?: string;
  data: AchievementData;
};

export const Payout = ({ logoSrc, marketImageSrc, data }: PayoutProps) => {
  if (!data) return null;

  return (
    <PayoutCard
      agentName="Omenstrat"
      venueName="Omen Markets"
      logoSrc={logoSrc}
      marketImageSrc={marketImageSrc}
      data={data}
    />
  );
};
