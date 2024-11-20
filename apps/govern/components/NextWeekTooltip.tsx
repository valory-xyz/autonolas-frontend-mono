import { InfoCircleOutlined } from '@ant-design/icons';
import { Space, Tooltip, Typography } from 'antd';
import { ReactNode } from 'react';
import { mainnet } from 'viem/chains';

import { COLOR } from '@autonolas-frontend-mono/ui-theme';
import { UNICODE_SYMBOLS } from '@autonolas-frontend-mono/util-constants';
import { VOTE_WEIGHTING } from '@autonolas-frontend-mono/util-contracts';

const { Text } = Typography;

const TOOLTIP_STYLE = { maxWidth: '350px' };

export const NextWeekTooltip = ({ children }: { children: ReactNode }) => {
  return (
    <Tooltip
      color={COLOR.WHITE}
      overlayStyle={TOOLTIP_STYLE}
      title={
        <Space direction="vertical">
          <Text>
            Updated voting weights will take effect at the start of next week (according to Unix
            time).
          </Text>
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
      <InfoCircleOutlined className="ml-8" style={{ color: COLOR.GREY_2 }} />
    </Tooltip>
  );
};
