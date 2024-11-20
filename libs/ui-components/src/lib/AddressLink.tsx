import { EXPLORER_URLS, UNICODE_SYMBOLS } from '@autonolas-frontend-mono/util-constants';
import { truncateAddress } from '@autonolas-frontend-mono/util-functions';

export const AddressLink = ({
  address,
  chainId,
  className,
}: {
  address: string;
  chainId: number;
  className?: string;
}) => (
  <a
    href={`${EXPLORER_URLS[chainId]}/address/${address}`}
    target="_blank"
    rel="noreferrer"
    className={className}
    title={address}
  >
    {`${truncateAddress(address)} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
  </a>
);
