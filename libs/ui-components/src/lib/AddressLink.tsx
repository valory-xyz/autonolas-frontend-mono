import { EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { truncateAddress } from 'libs/util-functions/src';

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
