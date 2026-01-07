import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { Meta } from '../../../components/Meta';

const MintComponent = dynamic(() => import('../../../components/ListComponents/mint'), {
  ssr: false,
});

const MintComponentPage = () => {
  const router = useRouter();
  const { network } = router.query;

  return (
    <>
      <Meta
        pageTitle="Mint Component"
        description="Register a new component on-chain. Mint your reusable component to the Olas registry for others to discover and integrate."
        pageUrl={`${network || ''}/components/mint`}
      />
      <MintComponent />
    </>
  );
};

export default MintComponentPage;
