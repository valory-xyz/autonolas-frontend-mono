import { useRouter } from 'next/router';

import Details from 'common-util/Details';
import { useHelpers } from 'common-util/hooks';
import {
  getAgentDetails,
  getAgentHashes,
  updateAgentHashes,
  getAgentOwner,
  getTokenUri,
} from './utils';

const Agent = () => {
  const router = useRouter();
  const id = router?.query?.id;
  const { account, links } = useHelpers();

  return (
    <Details
      type="agent"
      id={id}
      getDetails={() => getAgentDetails(id)}
      getHashes={() => getAgentHashes(id)}
      getTokenUri={() => getTokenUri(id)}
      getOwner={() => getAgentOwner(id)}
      onUpdateHash={async (newHash) => {
        await updateAgentHashes(account, id, newHash);
      }}
      onDependencyClick={(e) => router.push(`${links.COMPONENTS}/${e}`)}
    />
  );
};

export default Agent;