import PropTypes from 'prop-types';
import { Table } from 'antd';
import { useRouter } from 'next/router';
import { Loader } from '@autonolas/frontend-library';

import { TOTAL_VIEW_COUNT } from 'util/constants';
import { ListEmptyMessage } from 'common-util/List/ListCommon';
import { getData, getTableColumns } from './helpers';

const ListTable = ({
  isLoading,
  type,
  searchValue,
  list,
  total,
  currentPage,
  setCurrentPage,
  isAccountRequired,
  extra,
}) => {
  const router = useRouter();

  /**
   * no pagination on search as we won't know total beforehand
   */
  const isPaginationRequired = !searchValue;

  const { scrollX } = extra;

  if (isLoading) {
    return (
      <Loader
        isAccountRequired={isAccountRequired}
        message={
          isAccountRequired ? `To see your ${type}s, connect wallet` : ''
        }
      />
    );
  }

  const columns = getTableColumns(type, {
    router,
  });
  const dataSource = getData(type, list, { current: currentPage });

  return (
    <>
      {list.length === 0 ? (
        <ListEmptyMessage type={type} />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={
            isPaginationRequired
              ? {
                total,
                current: currentPage,
                defaultPageSize: TOTAL_VIEW_COUNT,
                onChange: (e) => setCurrentPage(e),
              }
              : false
          }
          scroll={{ x: scrollX || 1200 }}
          rowKey={(record) => `${type}-row-${record.id}`}
        />
      )}
    </>
  );
};

ListTable.propTypes = {
  type: PropTypes.string.isRequired,
  searchValue: PropTypes.string.isRequired,
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
