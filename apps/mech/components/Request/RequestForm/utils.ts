import { create } from 'ipfs-http-client';
import { base16 } from 'multiformats/bases/base16';

import { HASH_PREFIXES } from 'util/constants';

const ipfs = create({
  host: process.env.NEXT_PUBLIC_REGISTRY_URL as string,
  port: 443,
  protocol: 'https',
});

type InfoType = {
  image?: string;
  [key: string]: any; // To accommodate other properties in the info object
};

type OthersType = {
  noImage?: boolean;
};

export const getIpfsHashHelper = async (info: InfoType, others?: OthersType): Promise<string> => {
  const updatedInfo: InfoType = {
    ...info,
    image: info.image || '',
  };

  if (others?.noImage) {
    delete updatedInfo.image;
  }

  /**
   * metadata should be compatible with standards
   * https://docs.opensea.io/docs/metadata-standards
   */

  const otherOptions = {
    wrapWithDirectory: false, // default: false
  };

  const response = await ipfs.add(
    { path: 'metadata.json', content: JSON.stringify(updatedInfo) },
    otherOptions,
  );

  const hash = response.cid.toV1().toString(base16.encoder);

  // the response will always be of the 'type 1' so replace it.
  const updatedHash = hash.replace(HASH_PREFIXES.type1, '');
  return updatedHash;
};
