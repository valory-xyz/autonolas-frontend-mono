import { GATEWAY_URL } from '../constants/achievement';
import { getOmenThumbnailClient } from './graphql/client';
import { getOmenThumbnailQuery } from './graphql/queries';

type OmenThumbnailResponse = {
  omenThumbnailMapping: { image_hash: string } | null;
};

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const IMAGE_FETCH_TIMEOUT_MS = 5_000;

const encodeBase58 = (bytes: Buffer): string => {
  let value = BigInt(`0x${bytes.toString('hex')}`);
  let encoded = '';
  while (value > 0n) {
    encoded = BASE58_ALPHABET[Number(value % 58n)] + encoded;
    value /= 58n;
  }
  const leadingZeros = bytes.findIndex((byte) => byte !== 0);
  return '1'.repeat(leadingZeros === -1 ? bytes.length : leadingZeros) + encoded;
};

/** Converts a bytes32 sha2-256 digest into an IPFS CIDv0. */
export const byte32ToIpfsCidV0 = (hex: string): string =>
  encodeBase58(
    Buffer.concat([Buffer.from([0x12, 0x20]), Buffer.from(hex.replace(/^0x/, ''), 'hex')]),
  );

/**
 * Resolves the thumbnail of an Omen market. Any failure yields null so a
 * missing image never fails the card.
 */
export const getMarketImageUrl = async (fpmmId: string): Promise<string | null> => {
  const client = getOmenThumbnailClient();
  if (!client) return null;

  try {
    const data = await client.request<OmenThumbnailResponse>(getOmenThumbnailQuery, {
      id: fpmmId.toLowerCase(),
    });
    const imageHash = data.omenThumbnailMapping?.image_hash;
    if (!imageHash) return null;

    return `${GATEWAY_URL}${byte32ToIpfsCidV0(imageHash)}`;
  } catch (error) {
    console.error('Error fetching Omen market thumbnail:', error);
    return null;
  }
};

export const fetchMarketImage = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(IMAGE_FETCH_TIMEOUT_MS) });
    if (!response.ok) {
      console.error(`Market thumbnail fetch failed with status ${response.status}`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching market thumbnail image:', error);
    return null;
  }
};
