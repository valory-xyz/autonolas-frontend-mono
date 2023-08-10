import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { getAgentHash } from './functions';

/**
 * returns ID and hash from URL if present, else returns
 * the default mech id and hash (ie. 3rd element of agentList)
 */
export const useMechIdAndHash = () => {
  const router = useRouter();
  const idFromUrl = router?.query?.id;
  const hashFromUrl = router?.query?.hash;

  if (idFromUrl && hashFromUrl) {
    return { id: idFromUrl, hash: hashFromUrl };
  }

  // return default mech id and hash
  const agentList = useSelector((state) => state?.setup?.allAgents);
  if (!agentList || agentList.length === 0) {
    return { mech: null, hash: null };
  }

  const { mech, agentHashes } = agentList[2];
  const hash = getAgentHash(agentHashes);

  return { id: mech, hash };
};
