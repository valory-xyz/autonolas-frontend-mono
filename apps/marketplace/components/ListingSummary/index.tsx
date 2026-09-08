import { formatUtcTimestamp } from 'libs/util-functions/src';

import type { ListedUnit } from 'common-util/functions/fetchListings';

type ListingSummaryProps = {
  units: ListedUnit[];
  /** What the rows are, e.g. "AI agents". Used in the sentence. */
  label: string;
  networkName: string | null;
  snapshotGeneratedAt: string | null;
};

/**
 * A server-rendered copy of the listing below, for crawlers. `hidden` rather than `.sr-only`:
 * the interactive table renders the same rows once loaded, so exposing these to assistive tech
 * too would announce every entry twice.
 */
export const ListingSummary = ({
  units,
  label,
  networkName,
  snapshotGeneratedAt,
}: ListingSummaryProps) => {
  if (units.length === 0) return null;

  const asOf = formatUtcTimestamp(snapshotGeneratedAt);
  const where = networkName ? ` on ${networkName}` : '';

  return (
    <div hidden>
      <p>
        {`The ${units.length} most recently registered ${label}${where} in the Olas on-chain registry. `}
        {`The list below is the first page; the full set is paginated in the interactive table. `}
        {asOf ? `Server-rendered snapshot taken ${asOf}.` : ''}
      </p>
      <ul>
        {units.map((unit) => (
          <li key={unit.id}>
            <strong>{unit.publicId || `Unit ${unit.tokenId ?? unit.serviceId ?? unit.id}`}</strong>
            {unit.serviceId ? ` — service ID ${unit.serviceId}` : ''}
            {unit.tokenId ? ` — token ID ${unit.tokenId}` : ''}
            {unit.description ? `. ${unit.description}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
};
