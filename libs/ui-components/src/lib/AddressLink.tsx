// eslint-disable-next-line @nx/enforce-module-boundaries
import { truncateAddress } from 'libs/util-functions/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { EXPLORER_URLS, GATEWAY_URL, HASH_PREFIX, UNICODE_SYMBOLS } from 'libs/util-constants/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { COLOR } from 'libs/ui-theme/src';
import { Flex, Typography } from 'antd';
import { Copy } from './Copy';

const { Text } = Typography;

export const getIpfsUrl = (hash: string) => {
  if (!hash) return '';

  // Prefix only when the input is unambiguously the raw 32-byte digest.
  // Any multibase-encoded CID (base32 CIDv1 with any codec — bafy/bafk/
  // bafz/bagu…, base58 CIDv0 → Qm…) is already gateway-usable; a
  // whitelist by prefix drifted on new codecs, so we invert it.
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(hash)) return `${GATEWAY_URL}${hash}`;

  const cleanHash = hash.startsWith('0x') ? hash.substring(2) : hash;
  return `${GATEWAY_URL}${HASH_PREFIX}${cleanHash}`;
};

export const AddressLink = ({
  address,
  chainId,
  className,
  showExternalLinkSymbol = true,
  isIpfs = false,
  canCopy = false,
  canNotClick = false,
}: {
  address: string;
  chainId?: number;
  className?: string;
  isIpfs?: boolean;
  showExternalLinkSymbol?: boolean;
  canCopy?: boolean;
  canNotClick?: boolean;
}) => {
  const isTransaction = /^0x([A-Fa-f0-9]{64})$/.test(address);
  const url = isIpfs
    ? getIpfsUrl(address)
    : isTransaction
      ? `${EXPLORER_URLS[chainId!]}/tx/${address}`
      : `${EXPLORER_URLS[chainId!]}/address/${address}`;
  const trimmedText = truncateAddress(address);

  return (
    <Flex align="center" gap={8}>
      {canNotClick ? (
        <Text style={{ color: COLOR.PRIMARY }}>{trimmedText}</Text>
      ) : (
        <a href={url} target="_blank" rel="noreferrer" className={className} title={address}>
          {`${trimmedText}${showExternalLinkSymbol ? ` ${UNICODE_SYMBOLS.EXTERNAL_LINK}` : ''}`}
        </a>
      )}
      {canCopy && <Copy text={address} />}
    </Flex>
  );
};
