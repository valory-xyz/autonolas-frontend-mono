import Link from "next/link";
import { HashDetailsState, NavType } from "util/enum";
import { ArrowLink } from "../styles";
import React, { ReactNode } from "react";


type ViewHashAndCodeProps = {
    type: NavType;
    metadataLoadState: HashDetailsState;
    hashUrl: string;
    codeHref: string;
}

/**
 * Displays view hash and view code buttons redirecting to
 * links respectively
 */
const ViewHashAndCode = ({ type, metadataLoadState, hashUrl, codeHref }: 
    ViewHashAndCodeProps
): ReactNode => {
    if (HashDetailsState.LOADED !== metadataLoadState) return null;
  
    return (
      <>
        {type === NavType.SERVICE && <>&nbsp;•&nbsp;</>}
        <Link target="_blank" data-testid="view-hash-link" href={hashUrl}>
          View Hash&nbsp;
          <ArrowLink />
        </Link>
        &nbsp;•&nbsp;
        <Link target="_blank" data-testid="view-code-link" href={codeHref}>
          View Code&nbsp;
          <ArrowLink />
        </Link>
      </>
    );
  };

  export default ViewHashAndCode;