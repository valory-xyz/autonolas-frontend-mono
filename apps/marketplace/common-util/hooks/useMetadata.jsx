import { useState, useEffect, useMemo } from 'react';
import { NA } from 'libs/util-constants/src';
import { notifyError } from 'libs/util-functions/src';

import { transformImageUrl } from 'common-util/functions/ipfs';
import { normalizeAutonolasTokenUri } from 'common-util/functions/tokenUri';

import { HASH_DETAILS_STATE } from '../../util/constants';

/**
 * NFT details: hook to fetch metadata from IPFS
 * @param {string | null | undefined} tokenUri
 */
export const useMetadata = (tokenUri) => {
  const [metadata, setMetadata] = useState(null);
  const [metadataLoadState, setMetadataState] = useState(HASH_DETAILS_STATE.IS_LOADING);

  // fetch metadata from IPFS
  useEffect(() => {
    const getMetadata = async () => {
      setMetadataState(HASH_DETAILS_STATE.IS_LOADING);
      try {
        const ipfsUrl = normalizeAutonolasTokenUri(tokenUri);
        const response = await fetch(ipfsUrl);
        const json = await response.json();
        setMetadata(json);
        setMetadataState(HASH_DETAILS_STATE.LOADED);
      } catch (e) {
        setMetadataState(HASH_DETAILS_STATE.FAILED);
        console.error(e);
        notifyError('Error fetching metadata from IPFS');
      }
    };

    if (tokenUri) getMetadata();
  }, [tokenUri]);

  const hashUrl = useMemo(() => normalizeAutonolasTokenUri(tokenUri), [tokenUri]);

  const nftImageUrl = useMemo(() => transformImageUrl(metadata?.image), [metadata]);

  const codeHref = useMemo(() => transformImageUrl(metadata?.code_uri), [metadata]);

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
