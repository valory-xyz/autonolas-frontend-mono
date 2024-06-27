import { useEffect, useMemo, useState } from 'react';

import { NA, notifyError } from '@autonolas/frontend-library';

import { HashDetailsState } from 'util/enum';

import { GATEWAY_URL } from '../../util/constants';

const pattern = /https:\/\/localhost\/(agent|component|service)\/+/g;
const getAutonolasTokenUri = (tokenUri) => (tokenUri || '').replace(pattern, GATEWAY_URL);

/**
 * NFT details: hook to fetch metadata from IPFS
 * @param {string | null | undefined} tokenUri
 */
export const useMetadata = (tokenUri) => {
  const [metadata, setMetadata] = useState(null);
  const [metadataLoadState, setMetadataState] = useState(HashDetailsState.IS_LOADING);

  // fetch metadata from IPFS
  useEffect(() => {
    const getMetadata = async () => {
      setMetadataState(HashDetailsState.IS_LOADING);
      try {
        const ipfsUrl = getAutonolasTokenUri(tokenUri);
        const response = await fetch(ipfsUrl);
        const json = await response.json();
        setMetadata(json);
        setMetadataState(HashDetailsState.LOADED);
      } catch (e) {
        setMetadataState(HashDetailsState.FAILED);
        console.error(e);
        notifyError('Error fetching metadata from IPFS');
      }
    };

    if (tokenUri) getMetadata();
  }, [tokenUri]);

  const hashUrl = useMemo(() => getAutonolasTokenUri(tokenUri), [tokenUri]);

  const nftImageUrl = useMemo(() => {
    const image = metadata?.image;
    if (!image) return null;
    return image.replace('ipfs://', GATEWAY_URL);
  }, [metadata]);

  const codeHref = useMemo(() => {
    const codeUri = metadata?.code_uri;
    if (!codeUri) return null;
    return codeUri.replace('ipfs://', GATEWAY_URL);
  }, [metadata]);

  return {
    metadata,
    metadataLoadState,
    hashUrl,
    nftImageUrl,
    codeHref,
    description: metadata?.description || NA,
    version: metadata?.attributes?.[0]?.value || NA,
    packageName: metadata?.name || NA,
  };
};
