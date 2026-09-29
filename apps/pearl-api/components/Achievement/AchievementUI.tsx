import React from 'react';

import type { AchievementData, AchievementQueryParams } from 'types/achievement';
import { Omenstrat } from './Agents/Omenstrat';
import { Polystrat } from './Agents/Polystrat';

type AchievementUIProps = {
  params: AchievementQueryParams;
  logoSrc?: string;
  marketImageSrc?: string;
  data: AchievementData;
};

export const AchievementUI = ({ params, logoSrc, marketImageSrc, data }: AchievementUIProps) => {
  const { agent } = params;

  if (agent === 'polystrat') return <Polystrat params={params} logoSrc={logoSrc} data={data} />;
  if (agent === 'omenstrat') {
    return (
      <Omenstrat params={params} logoSrc={logoSrc} marketImageSrc={marketImageSrc} data={data} />
    );
  }

  return <div>Agent not yet supported.</div>;
};
