import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Table, Tag, Tooltip, Typography,
} from 'antd';
import { remove, round, isNaN } from 'lodash';
import { COLOR, NA } from '@autonolas/frontend-library';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { BONDING_PRODUCTS } from 'util/constants';
import { notifySpecificError, parseToEth } from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { ADDRESSES } from 'common-util/Contracts';
import { Deposit } from './Deposit';
import { getProductListRequest, getAllTheProductsNotRemoved } from './requests';
import { getLpTokenWithDiscount } from './requestsHelpers';

const { Text } = Typography;

const Container = styled.div`
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td,
  .ant-table tfoot > tr > th,
  .ant-table tfoot > tr > td {
    padding: 16px 10px;
  }
`;

const getTitle = (title, tooltipDesc) => (
  <Tooltip title={tooltipDesc}>
    <span>
      {title}
      &nbsp;
      <QuestionCircleOutlined />
    </span>
  </Tooltip>
);

const getColumns = (
  showNoSupply,
  onClick,
  isActive,
  acc,
  depositoryAddress,
) => {
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    {
      title: getTitle('LP Token', 'LP token address enabled by the Treasury'),
      dataIndex: 'lpTokenName',
      key: 'lpTokenName',
      render: (x, data) => (
        <a href={data.lpTokenLink} target="_blank" rel="noreferrer">
          {x}
        </a>
      ),
    },
    {
      title: getTitle('Current Price of LP Token', 'Denominated in OLAS'),
      dataIndex: 'fullCurrentPriceLp',
      key: 'fullCurrentPriceLp',
      render: (x, details) => (
        <a
          href={details.currentPriceLpLink}
          rel="noopener noreferrer"
          target="_blank"
        >
          {x}
        </a>
      ),
    },
    {
      title: getTitle(
        'OLAS minted per LP token',
        'Price for one LP token denominated in OLAS as offered by the bonding product.',
      ),
      dataIndex: 'roundedDiscountedOlasPerLpToken',
      key: 'roundedDiscountedOlasPerLpToken',
      render: (x) => (
        <a
          href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {x}
        </a>
      ),
    },
    {
      title: getTitle(
        'Current difference in value',
        'Percentage difference between current price of LP token and OLAS minted per LP token',
      ),
      render: (record) => {
        const { projectedChange } = record;

        if (isNaN(projectedChange)) {
          return <Text>{NA}</Text>;
        }

        return (
          <Text style={{ color: projectedChange > 0 ? 'green' : 'red' }}>
            {projectedChange > 0 && '+'}
            {projectedChange}
            %
          </Text>
        );
      },
    },
    {
      title: getTitle('Vesting', 'The bond vesting time to withdraw OLAS'),
      dataIndex: 'vesting',
      key: 'vesting',
      render: (seconds) => (
        <a
          href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {`${seconds / 86400} days`}
        </a>
      ),
    },
    {
      title: getTitle(
        'OLAS Supply',
        'Remaining OLAS supply reserved for this bonding product',
      ),
      dataIndex: 'supply',
      key: 'supply',
      render: (x, row) => {
        const supplyLeftInPercent = round(row.supplyLeft * 100, 0);
        return (
          <>
            <a
              href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {round(parseToEth(x), 2)}
            </a>
            &nbsp;
            <Tooltip title={`${supplyLeftInPercent}% of supply left`}>
              <Tag color={supplyLeftInPercent < 6 ? COLOR.RED : COLOR.PRIMARY}>
                {`${supplyLeftInPercent}%`}
              </Tag>
            </Tooltip>
          </>
        );
      },
    },
    {
      title: getTitle(
        'Initiate Bond',
        'Bond your LP pair to get OLAS at a discount',
      ),
      dataIndex: 'bondForOlas',
      key: 'bondForOlas',
      render: (_, row) => (
        <Button
          type="primary"
          // disbled if there is no supply or if the user is not connected
          disabled={showNoSupply || !acc}
          onClick={() => onClick(row)}
        >
          Bond
        </Button>
      ),
    },
  ];

  // should remove the bond button if the product is not active
  if (!isActive) {
    const withoutCreateBond = remove(
      [...columns],
      (x) => x.key !== 'bondForOlas',
    );
    return withoutCreateBond;
  }

  return columns;
};

export const BondingList = ({ bondingProgramType, hideEmptyProducts }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]); // all products
  const [filteredProducts, setFilteredProducts] = useState([]); // (active / inactive products)
  const showNoSupply = bondingProgramType === BONDING_PRODUCTS.ALL;

  // if productDetails is `not null`, then open the deposit modal
  const [productDetails, setProductDetails] = useState(null);

  const isActive = bondingProgramType === BONDING_PRODUCTS.ACTIVE;
  const depositoryAddress = ADDRESSES[chainId].depository;

  const getProducts = async () => {
    try {
      setIsLoading(true);

      // If bondingProgramType is allProduct, we will get all the products
      // that are not removed
      if (showNoSupply) {
        // fetches "all" products
        const productList = await getAllTheProductsNotRemoved();
        setAllProducts(productList);
      } else {
        // fetches both "active" and "inactive" products
        const filteredProductList = await getProductListRequest({ isActive });
        setFilteredProducts(filteredProductList);
      }
    } catch (error) {
      const errorMessage = typeof error?.message === 'string' ? error.message : null;
      notifySpecificError('Error while fetching products', errorMessage);
      console.error(error, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // fetch the bonding list
  useEffect(() => {
    getProducts();
  }, [account, chainId, bondingProgramType]);

  const onBondClick = (row) => {
    setProductDetails(row);
  };

  const onModalClose = () => {
    setProductDetails(null);
  };

  const sortList = (list) => list.sort((a, b) => {
    if (isNaN(a.projectedChange)) return 1;
    if (isNaN(b.projectedChange)) return -1;
    return b.projectedChange - a.projectedChange;
  });

  const getProductsDataSource = () => {
    const list = showNoSupply ? allProducts : filteredProducts;

    const sortedList = sortList(list);
    const processedList = hideEmptyProducts
      ? sortedList.filter((x) => x.supplyLeft > 0.001) : sortedList;

    return processedList;
  };

  return (
    <Container>
      <Table
        columns={getColumns(
          showNoSupply,
          onBondClick,
          isActive,
          account,
          depositoryAddress,
        )}
        dataSource={getProductsDataSource()}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
      />

      {!!productDetails && (
        <Deposit
          productId={productDetails?.id}
          productToken={productDetails?.token}
          productLpPrice={getLpTokenWithDiscount(
            productDetails?.priceLP,
            productDetails?.discount,
          )}
          productSupply={productDetails?.supply}
          getProducts={getProducts}
          closeModal={onModalClose}
        />
      )}
    </Container>
  );
};

BondingList.propTypes = {
  bondingProgramType: PropTypes.string,
  hideEmptyProducts: PropTypes.bool,
};

BondingList.defaultProps = {
  bondingProgramType: 'active',
  hideEmptyProducts: 'active',
};
