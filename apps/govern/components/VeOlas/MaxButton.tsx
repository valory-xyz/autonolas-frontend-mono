import { Button, Typography } from 'antd';

import { getCommaSeparatedNumber } from 'common-util/functions';

const { Text } = Typography;

type MaxButtonProps = { olasBalance?: string; onMaxClick: () => void };

export const MaxButton = ({ olasBalance, onMaxClick }: MaxButtonProps) => {
  return (
    <Text type="secondary">
      Balance:&nbsp;
      {getCommaSeparatedNumber(olasBalance || 0)}&nbsp;OLAS&nbsp;
      <Button htmlType="button" type="link" onClick={onMaxClick} className="pl-0">
        Max
      </Button>
    </Text>
  );
};
