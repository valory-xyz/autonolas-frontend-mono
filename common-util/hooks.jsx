import { useSelector } from 'react-redux';
import { getAgentHash } from './functions';

/**
 * returns the default mech id and hash (ie. 3rd element of agentList)
 */
export const useDefaultMechIdAndHash = () => {
  const agentList = useSelector((state) => state?.setup?.allAgents);
  if (!agentList || agentList.length === 0) return { mech: null, hash: null };

  const { mech, agentHashes } = agentList[2];
  const hash = getAgentHash(agentHashes);

  return { id: mech, hash };
};
