import {
  ExclamationCircleTwoTone,
  QuestionCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Empty, Popconfirm, Skeleton, Spin, Table, Tag, Tooltip, Typography } from 'antd';
import { capitalize, isNaN, remove, round } from 'lodash';
import Link from 'next/link';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import styled from 'styled-components';

import { NA, VM_TYPE, getNetworkName } from '@autonolas/frontend-library';

import { COLOR } from 'libs/ui-theme/src';

import { BONDING_PRODUCTS } from 'common-util/enums';
import { parseToEth } from 'common-util/functions/ethers';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { Deposit } from '../Deposit/Deposit';
import { useProducts } from './useBondingList';
import { getLpTokenWithDiscount } from './utils';

const { Text } = Typography;

const Container = styled.div`
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td,
  .ant-table tfoot > tr > th,
  .ant-table tfoot > tr > td {
    padding: 16px 10px;
  }
`;

const Loader = () => <Skeleton.Button size="small" className="full-width" active block />;

const isCurrentPriceLpZero = (currentPrice) => Number(currentPrice) === 0;

const getTitle = (title, tooltipDesc) => (
  <Tooltip title={tooltipDesc}>
    <span>
      {title}
      &nbsp;
      <QuestionCircleOutlined />
    </span>
  </Tooltip>
);

const getColumns = (onClick, isActive, acc, depositoryAddress, hideEmptyProducts) => {
  const getChainName = (type) => {
    if (type === VM_TYPE.SVM) return 'Solana';
    return getNetworkName(type);
  };
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Network',
      dataIndex: 'lpChainId',
      key: 'lpChainId',
      render: (x) => getChainName(x),
    },
    {
      title: 'Guide',
      dataIndex: 'guide',
      key: 'guide',
      width: 100,
      render: (x, data) => {
        return (
          <Link href={`/paths/${data.guide || 'olas-eth-via-uniswap-on-ethereum'}`}>Guide</Link>
        );
      },
    },
    {
      title: getTitle('Liquidity Pool', 'Liquidity Pool on target network'),
      dataIndex: 'lpLink',
      key: 'lpLink',
      width: 160,
      render: (x, data) => {
        return (
          <a href={x} target="_blank" rel="noreferrer">
            {`${capitalize(data.dexDisplayName)} on ${capitalize(getChainName(data.lpChainId))}`}
          </a>
        );
      },
    },
    {
      title: getTitle(
        'LP Token on Ethereum',
        'LP token address enabled by the Treasury on Ethereum',
      ),
      dataIndex: 'lpTokenName',
      key: 'lpTokenName',
      width: 140,
      render: (x, data) => {
        return (
          <a href={data.lpTokenLink} target="_blank" rel="noreferrer">
            {x}
          </a>
        );
      },
    },
    {
      title: getTitle('Current Price of LP Token', 'Denominated in OLAS'),
      dataIndex: 'fullCurrentPriceLp',
      key: 'fullCurrentPriceLp',
      width: 140,
      render: (text, details) => {
        if (isCurrentPriceLpZero(text)) {
          return <Loader />;
        }

        return (
          <a href={details.currentPriceLpLink} rel="noopener noreferrer" target="_blank">
            {text}
          </a>
        );
      },
    },
    {
      title: getTitle(
        'OLAS minted per LP token',
        'Price for one LP token denominated in OLAS as offered by the bonding product plus discount.',
      ),
      dataIndex: 'roundedDiscountedOlasPerLpToken',
      key: 'roundedDiscountedOlasPerLpToken',
      width: 180,
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
      width: 180,
      render: (record) => {
        const { projectedChange } = record;

        if (isNaN(projectedChange) || projectedChange === Infinity) {
          return <Text>{NA}</Text>;
        }

        return (
          <Text style={{ color: projectedChange > 0 ? 'green' : 'red' }}>
            {projectedChange > 0 && '+'}
            {projectedChange}%
          </Text>
        );
      },
    },
    {
      title: getTitle('Vesting', 'The bond vesting time to withdraw OLAS'),
      dataIndex: 'vesting',
      key: 'vesting',
      width: 120,
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
      title: getTitle('OLAS Supply', 'Remaining OLAS supply reserved for this bonding product'),
      dataIndex: 'supply',
      key: 'supply',
      width: 200,
      render: (x, row) => {
        const supplyLeftInPercent = isNaN(row.supplyLeft) ? 0 : round(row.supplyLeft * 100, 0);
        return (
          <>
            <a
              href={`https://etherscan.io/address/${depositoryAddress}#readContract#F10`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {round(parseToEth(x), 2)}
            </a>
            &nbsp;&nbsp;
            <Tag color={supplyLeftInPercent < 6 ? COLOR.GREY_2 : COLOR.PRIMARY}>
              {`${supplyLeftInPercent}%`}
            </Tag>
          </>
        );
      },
    },
    {
      title: getTitle('Initiate Bond', 'Bond your LP pair to get OLAS at a discount'),
      dataIndex: 'bondForOlas',
      key: 'bondForOlas',
      width: 160,
      render: (_, row) => {
        // disabled if there is no supply or if the user is not connected
        const isBondButtonDisabled = !hideEmptyProducts || !acc;
        const isCurrentDifferenceNegative = row.projectedChange < 0;

        // if the current difference is negative, then show a popconfirm
        // to confirm the user wants to bond
        if (isCurrentDifferenceNegative) {
          return (
            <Popconfirm
              title="Current difference in value is negative"
              description="Are you sure you want to bond?"
              okText="Proceed"
              cancelText="Cancel"
              placement="left"
              disabled={isBondButtonDisabled}
              onConfirm={() => onClick(row)}
            >
              <Button size="large" type="primary" disabled={isBondButtonDisabled}>
                Bond
              </Button>
            </Popconfirm>
          );
        }

        return (
          <Button
            size="large"
            type="primary"
            disabled={isBondButtonDisabled}
            onClick={() => onClick(row)}
          >
            Bond
          </Button>
        );
      },
    },
  ];

  // should remove the bond button if the product is not active
  if (!isActive) {
    const withoutCreateBond = remove([...columns], (x) => x.key !== 'bondForOlas');
    return withoutCreateBond;
  }

  return columns;
};

const sortProducts = (list) =>
  list.sort((a, b) => {
    // if the current price of the LP token is zero, then move it to the end of the list
    // NOTE: It can be zero because
    // - the API returns zero (shouldn't happen) OR
    // - has error OR
    // - not fetched yet
    const isAZeroPrice = isCurrentPriceLpZero(a.fullCurrentPriceLp);
    const isBZeroPrice = isCurrentPriceLpZero(b.fullCurrentPriceLp);

    if (isAZeroPrice && !isBZeroPrice) return 1;
    if (!isAZeroPrice && isBZeroPrice) return -1;
    if (isAZeroPrice && isBZeroPrice) return 0;

    // Sort by projectedChange for products with valid prices
    const isAProjectedChangeNaN = isNaN(a.projectedChange);
    const isBProjectedChangeNaN = isNaN(b.projectedChange);

    if (isAProjectedChangeNaN && !isBProjectedChangeNaN) return 1;
    if (!isAProjectedChangeNaN && isBProjectedChangeNaN) return -1;
    if (isAProjectedChangeNaN && isBProjectedChangeNaN) return 0;

    // Sort by projectedChange descending
    return b.projectedChange - a.projectedChange;
  });

const NoProducts = () => (
  <>
    <UnorderedListOutlined style={{ fontSize: 64 }} className="mb-8" />
    <br />
    No products
  </>
);

const ErrorMessageAndReload = () => (
  <Container className="mt-16">
    <Empty
      description={
        <>
          <Text className="mb-8">Couldn&apos;t fetch products</Text>
          <br />
          <Button size="large" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </>
      }
      image={<ExclamationCircleTwoTone style={{ fontSize: '7rem' }} twoToneColor={COLOR.GREY_1} />}
    />
  </Container>
);

export const BondingList = ({ bondingProgramType, hideEmptyProducts }) => {
  const { account } = useHelpers();

  const isActive = bondingProgramType === BONDING_PRODUCTS.ACTIVE;

  const {
    isLoading,
    errorState,
    filteredProducts,
    productDetails,
    handleProductDetails,
    depositoryAddress,
    refetch,
  } = useProducts({ isActive });

  const onBondClick = useCallback(
    (row) => {
      handleProductDetails(row);
    },
    [handleProductDetails],
  );

  const handleModalClose = useCallback(() => {
    handleProductDetails(null);
  }, [handleProductDetails]);

  const getProductsDataSource = useCallback(() => {
    const sortedList = sortProducts(filteredProducts);
    const processedList = hideEmptyProducts
      ? sortedList.filter((x) => x.supplyLeft > 0.00001)
      : sortedList;

    return processedList;
  }, [filteredProducts, hideEmptyProducts]);

  if (errorState) return <ErrorMessageAndReload />;
  return (
    <Container>
      <Table
        columns={getColumns(onBondClick, isActive, account, depositoryAddress, hideEmptyProducts)}
        locale={{
          emptyText: <div style={{ padding: '5rem' }}>{isLoading ? ' ' : <NoProducts />}</div>,
        }}
        dataSource={getProductsDataSource()}
        bordered
        loading={{
          spinning: isLoading,
          tip: <Typography className="mt-8">Loading products</Typography>,
          indicator: <Spin active />,
        }}
        pagination={false}
        scroll={{ x: 400 }}
        className="mb-16"
        rowHoverable={false}
      />

      {!!productDetails && (
        <Deposit
          productId={productDetails?.id}
          productToken={productDetails?.token}
          productLpPriceAfterDiscount={getLpTokenWithDiscount(
            productDetails?.priceLp,
            productDetails?.discount,
          ).toString()}
          productSupply={productDetails?.supply}
          productLpTokenName={productDetails?.lpTokenName}
          getProducts={refetch}
          closeModal={handleModalClose}
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
