import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const MintService = dynamic(() => import('../../../components/ListServices/mint'), {
  ssr: false,
});

const MintAIAgent = () => (
  <>
    <Meta
      pageTitle="Mint AI Agent"
      description="Register a new AI agent on-chain. Mint your autonomous agent to the Olas registry and make it discoverable in the marketplace."
      pageUrl="ai-agents/mint"
    />
    <MintService />
  </>
);

export default MintAIAgent;
