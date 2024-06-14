import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import { useVotingPower } from 'hooks/index';
import { useAccount } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src/lib/ui-theme';

import { UNICODE_SYMBOLS } from 'common-util/constants/unicode';
import { GET_VEOLAS_URL } from 'common-util/constants/urls';
import { formatWeiBalance } from 'common-util/functions';

const { Text, Paragraph } = Typography;

const Balance = () => {
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
          <a href={GET_VEOLAS_URL} target="_blank">
            Lock OLAS for veOLAS {UNICODE_SYMBOLS.EXTERNAL_LINK}
          </a>
        </>
      }
    >
      <Button type="text">
        <Text type="secondary" className="mr-8">
          <InfoCircleOutlined className="mr-8" />
          Your voting power:
        </Text>
        <Text strong>{formatWeiBalance(data)} veOLAS</Text>
      </Button>
    </Tooltip>
  );
};

export default Balance;
