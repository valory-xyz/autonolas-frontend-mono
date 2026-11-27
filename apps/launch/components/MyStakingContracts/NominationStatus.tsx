import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Tag, Typography } from 'antd';
import { FC, ReactNode } from 'react';

import { NominationStatus } from 'types/index';

import { useNominees } from 'hooks/useNominees';

const { Text } = Typography;

/**
 * A contract's nomination status. Only `notNominated` renders the Nominate action: while the
 * nominee read is loading or has failed (`unknown`), the contract may already be nominated.
 */
export const NominationStatusContent: FC<{
  status: NominationStatus;
  nominateAction: ReactNode;
}> = ({ status, nominateAction }) => {
  const { refetch, isFetching } = useNominees();

  switch (status) {
    case 'nominated':
      return (
        <Tag color="success">
          <CheckCircleOutlined />
          &nbsp;Nominated
        </Tag>
      );
    case 'notNominated':
      return <>{nominateAction}</>;
    case 'loading':
      return <Spin size="small" data-testid="nomination-status-loading" />;
    case 'unknown':
      return (
        <Flex vertical align="center" gap={4} data-testid="nomination-status-unknown">
          <Text type="secondary">Status unavailable</Text>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </Flex>
      );
  }
};
