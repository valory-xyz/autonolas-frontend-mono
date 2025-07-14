import { Tooltip } from 'antd';
import React from 'react';

import { truncateAddress } from '../common-util/functions';

function TruncatedEthereumLink({
  text,
  isTransaction = false,
  className = '',
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

export default TruncatedEthereumLink;
