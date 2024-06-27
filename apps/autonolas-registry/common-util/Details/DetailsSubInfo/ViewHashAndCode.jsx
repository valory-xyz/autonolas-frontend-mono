import { Typography } from 'antd';
import PropTypes from 'prop-types';

import { ArrowLink } from 'common-util/Details/styles';
import { typePropType } from 'common-util/propTypes';
import { HASH_DETAILS_STATE } from 'util/constants';
import { NAV_TYPES } from 'util/constants';

const { Link } = Typography;

/**
 * Displays view hash and view code buttons redirecting to
 * links respectively
 */
const ViewHashAndCode = ({ type, metadataLoadState, hashUrl, codeHref }) => {
  if (HASH_DETAILS_STATE.LOADED !== metadataLoadState) return null;

  return (
    <>
      {type === NAV_TYPES.SERVICE && <>&nbsp;•&nbsp;</>}
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

ViewHashAndCode.propTypes = {
  type: typePropType,
  metadataLoadState: PropTypes.string,
  hashUrl: PropTypes.string,
  codeHref: PropTypes.string,
};

ViewHashAndCode.defaultProps = {
  type: null,
  metadataLoadState: '',
  hashUrl: '',
  codeHref: '',
};

export default ViewHashAndCode;
