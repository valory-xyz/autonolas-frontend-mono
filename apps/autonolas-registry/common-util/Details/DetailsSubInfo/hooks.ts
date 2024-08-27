import { UNIT_TYPES } from 'libs/util-constants/src';

import { NAV_TYPES } from '../../../util/constants';

export const useTokenomicsUnitType = (type?: string) => {
  if (type === NAV_TYPES.COMPONENT) return UNIT_TYPES.COMPONENT;
  if (type === NAV_TYPES.AGENT) return UNIT_TYPES.AGENT;
  return;
};
