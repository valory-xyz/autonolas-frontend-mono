import { useRouter } from 'next/router';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { Loader } from '@autonolas/frontend-library';

import { ListEmptyMessage } from 'components/List/ListCommon';
import { TOTAL_VIEW_COUNT } from 'util/constants';

import { getData, getTableColumns } from './helpers';
import type { AgentData, ServiceData, Item } from './helpers';

type ListTableProps = {
  isLoading: boolean;
  type: string;
  isPaginationRequired: boolean;
  list: Item[];
  total: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isAccountRequired?: boolean;
  extra?: {
    scrollX: number;
  };
};

type ColumnType = ColumnsType<AgentData | ServiceData>;

const ListTable = ({
  isLoading = false,
  type,
  isPaginationRequired,
  list = [],
  total = 0,
  currentPage = 0,
  setCurrentPage = () => {},
  isAccountRequired = false,
  extra = { scrollX: 1200 },
}: ListTableProps) => {
  const router = useRouter();

  const { scrollX } = extra;

  if (isAccountRequired) {
    return (
      <Loader isAccountRequired notConnectedMessage={`To see your ${type}s, connect wallet`} />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  const columns = getTableColumns(type, { router });
  const dataSource = getData(type, list, { current: currentPage });
  const pagination = isPaginationRequired
    ? {
        total,
        current: currentPage,
        defaultPageSize: TOTAL_VIEW_COUNT,
        onChange: (e: number) => setCurrentPage(e),
      }
    : false;

  return (
    <>
      {list.length === 0 ? (
        <ListEmptyMessage type={type} />
      ) : (
        <Table
          columns={columns as ColumnType}
          dataSource={dataSource}
          pagination={pagination}
          scroll={{ x: scrollX }}
          rowKey={(record) => `${type}-row-${record.id}`}
        />
      )}
    </>
  );
};

export default ListTable;
