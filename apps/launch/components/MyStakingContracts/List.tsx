import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Table, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import Link from 'next/link';
import React, { FC, useMemo } from 'react';

import { URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

const { Paragraph } = Typography;

const useColumns = () => {
  const { networkName } = useAppSelector((state) => state.network);

  const columns: TableProps<MyStakingContract>['columns'] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '25%',
        render: (text, record) => (
          <Link href={`/${networkName}/${URL.myStakingContracts}/${record.id}`} passHref>
            {text}
          </Link>
        ),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        width: '25%',
        render: (text) => (
          <Paragraph ellipsis={{ rows: 2 }} style={{ width: 200, margin: 0 }}>
            {text}
          </Paragraph>
        ),
      },
      {
        title: 'Template',
        dataIndex: 'template',
        key: 'template',
        width: '25%',
      },
      {
        title: (
          <>
            Nominated for incentives?&nbsp;
            <Tooltip title="prompt text">
              <InfoCircleOutlined />
            </Tooltip>
          </>
        ),
        key: 'action',
        width: '25%',
        render: (_, record) => (
          <Button type="primary" disabled={record.isNominated}>
            {record.isNominated ? 'Nominated' : 'Nominate'}
          </Button>
        ),
      },
    ],
    [networkName],
  );

  return columns;
};

export const List: FC = () => {
  const { myStakingContracts } = useAppSelector((state) => state.launch);
  const listColumns = useColumns();

  const nonNominatedContracts = myStakingContracts.filter(
    (contract) => !contract.isNominated,
  ).length;

  return (
    <Flex className="pt-24" gap={24} vertical align="stretch">
      {nonNominatedContracts > 0 && (
        <Alert
          message={`${nonNominatedContracts} contract${
            nonNominatedContracts === 1 ? '' : 's'
          } hasn't been nominated to receive staking incentives`}
          type="info"
          showIcon
        />
      )}

      <Table columns={listColumns} dataSource={myStakingContracts} pagination={false} />
    </Flex>
  );
};
