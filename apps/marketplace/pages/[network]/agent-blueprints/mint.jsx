import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const MintAgent = dynamic(() => import('../../../components/ListAgents/mint'), {
  ssr: false,
});

const MintAgentBlueprint = () => (
  <>
    <Meta
      pageTitle="Mint Agent Blueprint"
      description="Register a new agent blueprint on-chain. Mint your agent template to the Olas registry for others to discover and use."
      pageUrl="agent-blueprints/mint"
    />
    <MintAgent />
  </>
);

export default MintAgentBlueprint;
