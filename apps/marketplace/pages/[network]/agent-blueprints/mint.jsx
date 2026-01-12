import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const MintAgent = dynamic(() => import('../../../components/ListAgents/mint'), {
  ssr: false,
});

const MintAgentBlueprint = () => {
  const router = useRouter();
  const { network } = router.query;

  return (
    <>
      <Meta
        pageTitle="Mint Agent Blueprint"
        description="Register a new agent blueprint on-chain. Mint your agent template to the Olas registry for others to discover and use."
        pageUrl={`${network || ''}/agent-blueprints/mint`}
      />
      <MintAgent />
    </>
  );
};

export default MintAgentBlueprint;
