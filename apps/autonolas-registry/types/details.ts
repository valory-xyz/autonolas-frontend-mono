import BigNumber from "bignumber.js";

export type DetailsValue<T = React.ReactNode | DetailsRewardRecord | string | number | null> = {
  title?: React.ReactNode | string | null;
  dataTestId?: string;
  value?: T;
};

export type UnitDetails = {
  unitHash: string;
  dependencies: BigNumber[];
};

export type ServiceDetails = {
  threshold: string;
  reward: string;
}

export type DetailsRewardRecord = Record<string, string>;
