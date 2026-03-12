import type { AchievementData, AchievementQueryParams } from '../../../../types/achievement';
import { Payout } from './Payout';

export const Polystrat = ({
  params,
  logoSrc,
  data,
}: {
  params: AchievementQueryParams;
  logoSrc?: string;
  data: AchievementData;
}) => {
  const { type } = params;

  if (type === 'payout') return <Payout params={params} logoSrc={logoSrc} data={data} />;

  return null;
};
