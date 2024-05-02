import PropTypes from 'prop-types';
import { Table } from 'antd';
import { Loader, useScreen } from '@autonolas/frontend-library';

import { TOTAL_VIEW_COUNT } from '../../../util/constants';
import { ListEmptyMessage } from '../ListCommon';
import { useHelpers } from '../../hooks';
import { convertTableRawData, getTableColumns } from './helpers';

export const ListTable = ({
  isLoading,
  type,
  searchValue,
  isPaginationRequired,
  list,
  total,
  currentPage,
  setCurrentPage,
  isAccountRequired,
  onViewClick,
  onUpdateClick,
  extra,
  tableDataTestId,
}) => {
  const { chainName, account, isSvm, chainId, isMainnet } = useHelpers();

  /**
   * no pagination on search as we won't know total beforehand
   */
  const canShowPagination = isPaginationRequired ? !searchValue : false;
  const { isMobile } = useScreen();

  const { scrollX } = extra;

  if (isLoading) {
    if (isSvm) {
      return <Loader />;
    }

    return (
      <Loader
        isAccountRequired={isAccountRequired}
        account={account}
        notConnectedMessage={`To see your ${type}s, connect wallet.`}
      />
    );
  }

  const columns = getTableColumns(type, {
    onViewClick,
    onUpdateClick,
    isMobile,
    chainName,
    chainId,
    account,
    isMainnet,
  });
  const dataSource = convertTableRawData(type, list, {
    currentPage,
    isMainnet,
  });
  const pagination = {
    total,
    current: currentPage,
    defaultPageSize: canShowPagination ? TOTAL_VIEW_COUNT : total,
    onChange: (e) => setCurrentPage(e),
    showSizeChanger: false,
  };

  return (
    <>
      {list.length === 0 ? (
        <ListEmptyMessage
          type={type}
          message={isSvm ? 'No services – do you have SOL in your wallet?' : ''}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={canShowPagination ? pagination : false}
          scroll={{ x: scrollX }}
          rowKey={(record) => `${type}-row-${record.id}`}
          data-testid={tableDataTestId || `${type}-table`}
        />
      )}
    </>
  );
};

ListTable.propTypes = {
  type: PropTypes.string.isRequired,
  searchValue: PropTypes.string.isRequired,
  isPaginationRequired: PropTypes.bool,
  isLoading: PropTypes.bool,
  list: PropTypes.arrayOf(PropTypes.object),
  total: PropTypes.number,
  currentPage: PropTypes.number,
  setCurrentPage: PropTypes.func,
  isAccountRequired: PropTypes.bool,
  onViewClick: PropTypes.func,
  onUpdateClick: PropTypes.func,
  tableDataTestId: PropTypes.string,
  extra: PropTypes.shape({
    scrollX: PropTypes.number,
  }),
};

ListTable.defaultProps = {
  isLoading: false,
  isPaginationRequired: true,
  list: [],
  total: 0,
  currentPage: 0,
  setCurrentPage: () => {},
  isAccountRequired: false,
  onViewClick: () => {},
  onUpdateClick: null,
  extra: { scrollX: 1200 },
};
