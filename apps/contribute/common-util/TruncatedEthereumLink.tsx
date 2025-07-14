import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

import { truncateAddress } from './functions';

function TruncatedEthereumLink({
  text,
  isTransaction,
  className,
}: {
  text: string;
  isTransaction: boolean;
  className: string;
}) {
  const etherscanLink = `https://etherscan.io/${isTransaction ? 'tx' : 'address'}/${text}`;

  return (
    <Tooltip title={text}>
      <a href={etherscanLink} target="_blank" rel="noopener noreferrer" className={className}>
        {`${truncateAddress(text)} ↗`}
      </a>
    </Tooltip>
  );
}

TruncatedEthereumLink.propTypes = {
  text: PropTypes.string.isRequired,
  isTransaction: PropTypes.bool,
  className: PropTypes.string,
};

TruncatedEthereumLink.defaultProps = {
  isTransaction: false,
  className: '',
};

export default TruncatedEthereumLink;
