import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import Link from 'next/link';
import { useAccount } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src/lib/ui-theme';
import { UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { formatWeiNumber } from 'libs/util-functions/src';

import { useVotingPower } from 'hooks/index';

const { Text, Paragraph } = Typography;

export const Balance = () => {
  const { address: account } = useAccount();
  const { data, isFetching } = useVotingPower(account);

  if (isFetching) return null;
  if (data === undefined) return null;
  if (!account) return null;

  return (
    <Tooltip
      color={COLOR.WHITE}
      title={
        <>
          <Paragraph>veOLAS gives you voting power in Autonolas governance.</Paragraph>
          <Link href="/veolas">Lock OLAS for veOLAS {UNICODE_SYMBOLS.EXTERNAL_LINK}</Link>
        </>
      }
    >
      <Button size="large" type="text">
        <Text type="secondary" className="mr-8">
          <InfoCircleOutlined className="mr-8" />
          Your voting power:
        </Text>
        <Text strong>{formatWeiNumber({ value: data })} veOLAS</Text>
      </Button>
    </Tooltip>
  );
};
