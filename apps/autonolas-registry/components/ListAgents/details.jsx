import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { Details } from 'common-util/Details';
import { useHelpers } from 'common-util/hooks';

import {
  getAgentDetails,
  getAgentOwner,
  getTokenUri as getAgentTokenUri,
  updateAgentHashes,
} from './utils';

const Agent = () => {
  const router = useRouter();
  const id = BigNumber(router?.query?.id);
  const { account, links } = useHelpers();

  const getDetails = useCallback(async () => getAgentDetails(id), [id]);
  const getOwner = useCallback(async () => getAgentOwner(id), [id]);
  const getTokenUri = useCallback(async () => getAgentTokenUri(id), [id]);
  const onUpdateHash = useCallback(
    async (newHash) => {
      await updateAgentHashes(account, id, newHash);
    },
    [account, id],
  );

  return (
    <Details
      type="agent"
      id={id}
      getDetails={getDetails}
      getOwner={getOwner}
      getTokenUri={getTokenUri}
      handleHashUpdate={onUpdateHash}
      navigateToDependency={(e) => router.push(`${links.COMPONENTS}/${e}`)}
    />
  );
};

export default Agent;
