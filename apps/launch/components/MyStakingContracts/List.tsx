import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Popover, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { FC, useMemo } from 'react';

import { GOVERN_URL, URL } from 'common-util/constants/urls';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

const { Paragraph } = Typography;

const NominatedForIncentivesPopover = () => (
  <Popover
    arrow={false}
    content={
      <div style={{ maxWidth: 580 }}>
        Nominate your contract to make it eligible to receive staking incentives. Staking incentives
        are allocated via&nbsp;
        <a href={GOVERN_URL} target="_blank" rel="noreferrer">
          Govern
        </a>
        .
      </div>
    }
  >
    Nominated for incentives?&nbsp;
    <InfoCircleOutlined />
  </Popover>
);

const useColumns = () => {
  const router = useRouter();
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
        title: NominatedForIncentivesPopover,
        key: 'action',
        width: '25%',
        render: (_, record) => {
          return (
            <Flex justify="center">
              {record.isNominated ? (
                <Tag color="success">
                  <CheckCircleOutlined />
                  &nbsp;Nominated
                </Tag>
              ) : (
                <Button type="primary" onClick={() => router.push(`/${URL.nominateContract}`)}>
                  Nominate
                </Button>
              )}
            </Flex>
          );
        },
      },
    ],
    [networkName, router],
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

      <Table
        columns={listColumns}
        dataSource={myStakingContracts}
        pagination={false}
        rowKey={(record) => record.id}
      />
    </Flex>
  );
};
