import { useMemo } from 'react';



import { getCommaSeparatedNumber } from 'common-util/functions';



import { InfoCard } from './InfoCard';


const SECONDS_IN_A_YEAR = 31536000;

type ProjectedVeOlasProps = {
  olasAmount?: number;
  unlockTime?: number;
};

export const ProjectedVeOlas = ({ olasAmount, unlockTime }: ProjectedVeOlasProps) => {
  /**
   * @returns projected veOLAS amount as per the formula.
   * formula = veOLAS = OLAS * lockDuration / maxLockDuration
   */
  const projectedVeOlas = useMemo(() => {
    if (!olasAmount) return 0;
    if (!unlockTime) return 0;

    const maxLockDuration = SECONDS_IN_A_YEAR * 4;
    const todayDateMs = new Date().getTime();
    const lockDuration = (unlockTime - todayDateMs) / 1000;

    const projectedVeOlas = (olasAmount * lockDuration) / maxLockDuration;

    if (!projectedVeOlas || lockDuration < 0) {
      return 0;
    }

    return getCommaSeparatedNumber(projectedVeOlas.toFixed(2).toString());
  }, [olasAmount, unlockTime]);

  return (
    <InfoCard
      isLoading={false}
      title="Estimated voting power you get"
      value={`${projectedVeOlas} veOLAS`}
    />
  );
};