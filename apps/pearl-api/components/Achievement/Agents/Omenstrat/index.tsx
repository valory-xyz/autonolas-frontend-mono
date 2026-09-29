import type { AchievementData, AchievementQueryParams } from '../../../../types/achievement';
import { Payout } from './Payout';

export const Omenstrat = ({
  params,
  logoSrc,
  marketImageSrc,
  data,
}: {
  params: AchievementQueryParams;
  logoSrc?: string;
  marketImageSrc?: string;
  data: AchievementData;
}) => {
  const { type } = params;

  if (type === 'payout') {
    return <Payout params={params} logoSrc={logoSrc} marketImageSrc={marketImageSrc} data={data} />;
  }

  return null;
};
