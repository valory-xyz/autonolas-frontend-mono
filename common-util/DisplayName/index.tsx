import Link from 'next/link';

import { truncateAddress } from 'common-util/functions';

type DisplayNameProps = {
  actorAddress: string;
  username: string;
};
export const DisplayName = ({ actorAddress, username }: DisplayNameProps) => (
  <Link href={`/profile/${actorAddress}`}>{username || truncateAddress(actorAddress)}</Link>
);
