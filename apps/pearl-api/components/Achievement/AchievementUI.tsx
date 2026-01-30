import React from 'react';

import type { AchievementData, AchievementQueryParams } from 'types/achievement';
import { Polystrat } from './Agents/Polystrat';

type AchievementUIProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
  data: AchievementData;
};

export const AchievementUI = ({ params, logoSrc, data }: AchievementUIProps) => {
  const { agent } = params;

  if (agent === 'polystrat') return <Polystrat params={params} logoSrc={logoSrc} data={data} />;

  return null;
};
