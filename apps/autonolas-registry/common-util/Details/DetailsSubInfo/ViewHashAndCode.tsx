import Link from 'next/link';

import { UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { HASH_DETAILS_STATE, NavTypesValues } from 'util/constants';
import { NAV_TYPES } from 'util/constants';

type ViewHashAndCodeProps = {
  type: NavTypesValues;
  metadataLoadState: string;
  hashUrl: string;
  codeHref: string;
};

/**
 * Displays view hash and view code buttons redirecting to
 * links respectively
 */
export const ViewHashAndCode = ({
  type,
  metadataLoadState,
  hashUrl,
  codeHref,
}: ViewHashAndCodeProps) => {
  if (HASH_DETAILS_STATE.LOADED !== metadataLoadState) return null;

  return (
    <>
      {type === NAV_TYPES.SERVICE && <>&nbsp;•&nbsp;</>}
      <Link target="_blank" data-testid="view-hash-link" href={hashUrl}>
        View Hash {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Link>
      &nbsp;•&nbsp;
      <Link target="_blank" data-testid="view-code-link" href={codeHref}>
        View Code {UNICODE_SYMBOLS.EXTERNAL_LINK}
      </Link>
    </>
  );
};
