import { ContributeModuleDetails } from 'types/moduleDetails';

export const getModuleDetails = async () => {
  const response = await fetch('/api/moduleDetails');
  const json: ContributeModuleDetails[] = await response.json();
  // The array contains only one element
  const moduleDetails: ContributeModuleDetails['json_value'] = json?.[0]?.json_value;

  return moduleDetails;
};
