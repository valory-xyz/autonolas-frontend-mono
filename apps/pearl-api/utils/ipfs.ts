import { create } from 'ipfs-http-client';
import { base32 } from 'multiformats/bases/base32';

import { GATEWAY_URL, IPFS_CONFIG } from '../constants/achievement';

const getIpfsClient = () => {
  if (!IPFS_CONFIG.HOST) {
    throw new Error('IPFS host is not configured. Set NEXT_PUBLIC_REGISTRY_URL.');
  }

  return create({
    host: IPFS_CONFIG.HOST,
    port: IPFS_CONFIG.PORT,
    protocol: IPFS_CONFIG.PROTOCOL,
  });
};

export const uploadImageToIpfs = async (
  imageBuffer: Buffer,
): Promise<{ hash: string; url: string }> => {
  const ipfs = getIpfsClient();

  const response = await ipfs.add(imageBuffer, {
    wrapWithDirectory: false,
  });

  const hash = response.cid.toV1().toString(base32.encoder);
  const url = `${GATEWAY_URL}${hash}`;

  return { hash, url };
};
