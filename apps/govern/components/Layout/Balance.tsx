import { ArrowUpOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import { useVotingPower } from 'hooks/index';

import { COLOR } from 'libs/ui-theme/src/lib/ui-theme';
import { useAppSelector } from 'store/index';

import { GET_VEOLAS_URL } from 'common-util/constants/urls';

const { Text, Paragraph } = Typography;

const Balance = () => {
  const { account } = useAppSelector((state) => state.setup);
  const { data, isFetching } = useVotingPower(account);

  if (isFetching) return null;
  if (data === undefined) return null;

  return (
    <Tooltip
      color={COLOR.WHITE}
      title={
        <>
          <Paragraph>veOLAS gives you voting power in Autonolas governance.</Paragraph>
          <a href={GET_VEOLAS_URL} target="_blank">
            Lock OLAS for veOLAS <ArrowUpOutlined style={{ rotate: '45deg' }} />
          </a>
        </>
      }
    >
      <Button type="text">
        <Text type="secondary" className="mr-8">
          <InfoCircleOutlined className="mr-8" />
          Your voting power:
        </Text>
        <Text strong>{data} veOLAS</Text>
      </Button>
    </Tooltip>
  );
};

export default Balance;
