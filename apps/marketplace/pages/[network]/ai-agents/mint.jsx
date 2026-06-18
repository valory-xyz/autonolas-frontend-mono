import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';
import { getNetworkDisplayName } from '../../../common-util/functions';

const MintService = dynamic(() => import('../../../components/ListServices/mint'), {
  ssr: false,
});

const MintAIAgent = () => {
  const router = useRouter();
  const { network } = router.query;
  const networkName = getNetworkDisplayName(network);

  return (
    <>
      <Meta
        pageTitle={networkName ? `Mint AI Agent on ${networkName}` : 'Mint AI Agent'}
        description="Register a new AI agent on-chain. Mint your autonomous agent to the Olas registry and make it discoverable in the marketplace."
        pageUrl={`${network || ''}/ai-agents/mint`}
      />
      <MintService />
    </>
  );
};

export default MintAIAgent;
