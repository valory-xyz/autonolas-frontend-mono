import { Table } from 'antd';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

import { Loader } from '@autonolas/frontend-library';

import { ListEmptyMessage } from 'common-util/List/ListCommon';
import { TOTAL_VIEW_COUNT } from 'util/constants';

import { getData, getTableColumns } from './helpers';

const ListTable = ({
  isLoading,
  type,
  isPaginationRequired,
  list,
  total,
  currentPage,
  setCurrentPage,
  isAccountRequired,
  extra,
}) => {
  const router = useRouter();

  const { scrollX } = extra;

  if (isAccountRequired) {
    return <Loader isAccountRequired message={`To see your ${type}s, connect wallet`} />;
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
        onChange: (e) => setCurrentPage(e),
      }
    : false;

  return (
    <>
      {list.length === 0 ? (
        <ListEmptyMessage type={type} />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={pagination}
          scroll={{ x: scrollX || 1200 }}
          rowKey={(record) => `${type}-row-${record.id}`}
        />
      )}
    </>
  );
};

ListTable.propTypes = {
  type: PropTypes.string.isRequired,
  isPaginationRequired: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool,
  list: PropTypes.arrayOf(PropTypes.shape({})),
  total: PropTypes.number,
  currentPage: PropTypes.number,
  setCurrentPage: PropTypes.func,
  isAccountRequired: PropTypes.bool,
  extra: PropTypes.shape({
    scrollX: PropTypes.number,
  }),
};

ListTable.defaultProps = {
  isLoading: false,
  list: [],
  total: 0,
  currentPage: 0,
  setCurrentPage: () => {},
  isAccountRequired: false,
  extra: {},
};

export default ListTable;
