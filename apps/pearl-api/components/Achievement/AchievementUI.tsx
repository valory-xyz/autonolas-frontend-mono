import React from 'react';

import type { AchievementQueryParams } from 'types/achievement';
import { PolystratPayout } from './Agents/Polystrat';

type AchievementUIProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
};

export const AchievementUI = ({ params, logoSrc }: AchievementUIProps) => {
  const { agent } = params;

  if (agent === 'polystrat') return <PolystratPayout params={params} logoSrc={logoSrc} />;
  return null;
};
