import { useRouter } from 'next/router';

import { URL } from 'util/constants';
import Details from 'common-util/Details';
import { useHelpers } from 'common-util/hooks/useHelpers';
import {
  getAgentDetails,
  getAgentHashes,
  updateAgentHashes,
  getAgentOwner,
  getTokenUri,
} from '../utils';

const Agent = () => {
  const router = useRouter();
  const id = router?.query?.id || null;
  const { account } = useHelpers();

  return (
    <Details
      type="agent"
      id={id}
      getDetails={() => getAgentDetails(id)}
      getHashes={() => getAgentHashes(id)}
      getOwner={() => getAgentOwner(id)}
      getTokenUri={() => getTokenUri(id)}
      onUpdateHash={(newHash) => updateAgentHashes(account, id, newHash)}
      onDependencyClick={(e) => router.push(`${URL.COMPONENTS}/${e}`)}
    />
  );
};

export default Agent;
