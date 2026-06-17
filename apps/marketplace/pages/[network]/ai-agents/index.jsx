import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getNetworkDisplayName } from '../../../common-util/functions';

const ListServices = dynamic(() => import('../../../components/ListServices'), {
  ssr: false,
});

const AIAgents = () => {
  const router = useRouter();
  const { network } = router.query;
  const networkName = getNetworkDisplayName(network);

  return (
    <>
      <Meta
        pageTitle={networkName ? `AI Agents on ${networkName}` : 'AI Agents'}
        description="Explore autonomous AI agents registered on-chain. Browse, discover, and view activity of AI agents from the Olas marketplace."
        pageUrl={`${network || ''}/ai-agents`}
      />
      <ListServices />
    </>
  );
};

export default AIAgents;
