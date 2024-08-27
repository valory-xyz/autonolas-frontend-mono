import { NAV_TYPES, TOKENOMICS_UNIT_TYPES } from '../../../util/constants';

export const getTokenomicsUnitType = (type?: string) => {
  if (type === NAV_TYPES.COMPONENT) return TOKENOMICS_UNIT_TYPES.COMPONENT;
  if (type === NAV_TYPES.AGENT) return TOKENOMICS_UNIT_TYPES.AGENT;
  return;
};
