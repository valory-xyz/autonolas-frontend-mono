import { EditOutlined } from '@ant-design/icons';
import { Button, Dropdown, Grid } from 'antd';
import { isNil } from 'lodash';

import { useHelpers } from 'common-util/hooks/useHelpers';

import DelegateMenu from './DelegateMenu';
import { useFetchVotingPower } from './hooks';
// import { VerticalDivider } from './styles';
import { formatWeiBalance } from './utils';

const { useBreakpoint } = Grid;

const VotingPower = () => {
  const screens = useBreakpoint();

  const { account } = useHelpers();
  const { votingPower, refetchVotingPower } = useFetchVotingPower(account);

  if (screens.xs) return null;
  if (isNil(votingPower)) return null;

  return (
    <>
      {/* <VerticalDivider /> */}
      <Dropdown
        placement="bottomRight"
        arrow
        trigger={['click']}
        overlay={
          <DelegateMenu
            votingPower={votingPower.toString()}
            refetchVotingPower={refetchVotingPower}
          />
        }
      >
        <Button type="text">
          Voting power: {formatWeiBalance(votingPower.toString())}
          <EditOutlined />
        </Button>
      </Dropdown>
    </>
  );
};

export default VotingPower;
