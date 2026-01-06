import dynamic from 'next/dynamic';
import { Meta } from '../../../components/Meta';

const MintComponent = dynamic(() => import('../../../components/ListComponents/mint'), {
  ssr: false,
});

const MintComponentPage = () => (
  <>
    <Meta
      pageTitle="Mint Component"
      description="Register a new component on-chain. Mint your reusable component to the Olas registry for others to discover and integrate."
      pageUrl="components/mint"
    />
    <MintComponent />
  </>
);

export default MintComponentPage;
