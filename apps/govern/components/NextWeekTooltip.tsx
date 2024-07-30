import { Space, Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';
import { mainnet } from 'viem/chains';

import { COLOR } from 'libs/ui-theme/src';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { VOTE_WEIGHTING } from 'libs/util-contracts/src/lib/abiAndAddresses';

const { Text } = Typography;

const TOOLTIP_STYLE = { maxWidth: '350px' };

export const NextWeekTooltip = ({ children }: { children: ReactNode }) => {
  return (
    <Tooltip
      color={COLOR.WHITE}
      overlayStyle={TOOLTIP_STYLE}
      title={
        <Space direction="vertical">
          <Text>Updated voting weights will take effect at the start of next week Unix time.</Text>
          <a
            href={`https://etherscan.io/address/${
              VOTE_WEIGHTING.addresses[mainnet.id]
            }#readContract#F29`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {`View timestamp when the last votes apply ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
          </a>
        </Space>
      }
    >
      {children}
    </Tooltip>
  );
};
