// eslint-disable-next-line @nx/enforce-module-boundaries
import { GATEWAY_URL, HASH_PREFIX } from 'libs/util-constants/src';

// Extracted from AddressLink.tsx so unit tests can import the helper
// without pulling the whole JSX module through the test runner
// (which needs React/JSX transform).
//
// Prefix only when the input is unambiguously the raw 32-byte digest.
// Any multibase-encoded CID (base32 CIDv1 with any codec — bafy/bafk/
// bafz/bagu…, base58 CIDv0 → Qm…) is already gateway-usable; a
// whitelist by prefix drifted on new codecs, so we invert it.
export const getIpfsUrl = (hash: string) => {
  if (!hash) return '';

  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(hash)) return `${GATEWAY_URL}${hash}`;

  const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
  return `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
};
