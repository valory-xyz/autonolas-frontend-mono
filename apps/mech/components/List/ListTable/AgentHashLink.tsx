import { Skeleton } from 'antd';
import { useEffect, useState } from 'react';

import { AddressLink, NA } from '@autonolas/frontend-library';

import { getMetadataHashByServiceId } from 'common-util/functions/requests';

const FETCH_HASH_TIMEOUT = 10000;

type AddressHashLinkProps = {
  serviceId: string;
  suffixCount: number;
  canCopy: boolean;
  textMinWidth: number;
  chainId: number;
};

export const AddressHashLink = ({ serviceId, ...rest }: AddressHashLinkProps) => {
  const [text, setText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getMetaDataHash = async () => {
      try {
        // Create an AbortController for each request
        const controller = new AbortController();
        const signal = controller.signal;

        // Set a timeout to abort the request if it takes too long
        const timeoutId = setTimeout(() => controller.abort(), FETCH_HASH_TIMEOUT);

        const metadataHash = await getMetadataHashByServiceId(serviceId, signal);
        clearTimeout(timeoutId);
        setText(metadataHash);
      } finally {
        setIsLoading(false);
      }
    };

    getMetaDataHash();
  }, [serviceId]);

  if (isLoading) return <Skeleton.Input size="small" />;
  if (!text) return NA;
  return <AddressLink text={text} {...rest} isIpfsLink />;
};
