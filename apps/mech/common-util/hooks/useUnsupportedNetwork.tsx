import { Button, Result } from 'antd';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { gnosis } from 'viem/chains';

import { URL } from 'util/constants';

export const useUnsupportedNetwork = () => {
  const router = useRouter();

  const networkNameFromUrl = router?.query?.network;
  const isWrongNetwork = networkNameFromUrl !== gnosis.name.toLowerCase();

  const wrongNetworkContent = useMemo(() => {
    if (!networkNameFromUrl) return null;

    return (
      <Result
        status="warning"
        title="Selected network is not supported"
        extra={
          <Button
            size="large"
            type="link"
            onClick={() => router.push(`/${gnosis.name.toLowerCase()}/${URL.MECHS}`)}
          >
            Switch to Gnosis
          </Button>
        }
      />
    );
  }, [networkNameFromUrl, router]);

  return { isWrongNetwork, wrongNetworkContent };
};
