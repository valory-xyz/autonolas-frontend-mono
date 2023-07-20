import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Table, Tag, Tooltip,
} from 'antd/lib';
import { isNumber, remove, round } from 'lodash';
import { COLOR } from '@autonolas/frontend-library';
import {
  notifyError,
  getFormattedDate,
  parseToEth,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { Deposit } from './Deposit';
import { getProductListRequest, getAllTheProductsNotRemoved } from './requests';

const getLpTokenWithDiscound = (lpTokenValue, discount) => {
  const price = Number(parseToEth(lpTokenValue));
  const discountedPrice = price + (price * discount) / 100;
  return round(discountedPrice, 4);
};

const getColumns = (showNoSupply, onClick, isActive, acc) => {
  const columns = [
    {
      title: (
        <Tooltip title="Identifier of bonding product">Bonding Product</Tooltip>
      ),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: (
        <Tooltip title="Uniswap v2 LP token address enabled by the Treasury">
          <span>LP Token</span>
        </Tooltip>
      ),
      dataIndex: 'lpTokenName',
      key: 'lpTokenName',
      render: (x, data) => (
        <a
          href={`https://v2.info.uniswap.org/pair/${data.token}`}
          target="_blank"
          rel="noreferrer"
        >
          {x}
        </a>
      ),
    },
    {
      title: (
        <Tooltip title="LP token price at which an LP share is priced during the bonding product">
          <span>OLAS minted per LP token</span>
        </Tooltip>
      ),
      dataIndex: 'priceLP',
      key: 'priceLP',
      render: (x, data) => {
        const discount = data?.discount || 0;
        return getLpTokenWithDiscound(x, discount);
      },
    },
    {
      title: (
        <Tooltip title="Percentage of discount depending on the usefulness of the code in the ecosystem">
          Discount
        </Tooltip>
      ),
      dataIndex: 'discount',
      key: 'discount',
      render: (x) => (
        <Tag color={COLOR.PRIMARY} key={x}>
          {`${x}%`}
        </Tag>
      ),
    },
    {
      title: (
        <Tooltip title="OLAS supply reserved for this bonding product">
          <span>OLAS Supply</span>
        </Tooltip>
      ),
      dataIndex: 'supply',
      key: 'supply',
      render: (x) => `${round(parseToEth(x), 4)}`,
    },
    {
      title: (
        <Tooltip
          title="
        APY is a calculation of the LP per OLAS bonding at a current time. The value is based on the chosen initial LP price before the product was initialized, and the current LP price, if the LP was liquidated and fully converted to OLAS - compared to the amount of OLAS one can get if they bond their LP tokens (without liquidation) for OLAS."
        >
          <span>Projected APY</span>
        </Tooltip>
      ),
      dataIndex: 'apy',
      key: 'apy',
      render: (text) => (isNumber(text) ? `${text}%` : '--'),
    },
    {
      title: (
        <Tooltip title="The vesting time to withdraw OLAS">
          <span>Expiry</span>
        </Tooltip>
      ),
      dataIndex: 'expiry',
      key: 'expiry',
      render: (seconds) => getFormattedDate(seconds * 1000),
    },
    {
      title: (
        <Tooltip title="Bond your LP pair to get OLAS at a discount">
          Initiate Bond
        </Tooltip>
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

export const BondingList = ({ bondingProgramType }) => {
  const { account, chainId } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const showNoSupply = bondingProgramType === 'allProduct';

  // if productDetails is `not null`, then open the deposit modal
  const [productDetails, setProductDetails] = useState(null);

  const isActive = bondingProgramType === 'active';

  const getProducts = useCallback(async () => {
    try {
      setIsLoading(true);

      // If bondingProgramType is allProduct, we will get all the products
      // that are not removed
      if (showNoSupply) {
        const productList = await getAllTheProductsNotRemoved();
        setProducts(productList);
      } else if (account) {
        const productList = await getProductListRequest({
          account,
          isActive,
        });
        setProducts(productList);
      }
    } catch (error) {
      window.console.error(error);
      notifyError();
    } finally {
      setIsLoading(false);
    }
  }, [account, chainId, bondingProgramType]);

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

  return (
    <>
      <Table
        columns={getColumns(showNoSupply, onBondClick, isActive, account)}
        dataSource={products}
        bordered
        loading={isLoading}
        pagination={false}
        scroll={{ x: 400 }}
      />

      {!!productDetails && (
        <Deposit
          productId={productDetails?.id}
          productToken={productDetails?.token}
          productLpPrice={getLpTokenWithDiscound(
            productDetails?.priceLP,
            productDetails?.discount,
          )}
          getProducts={getProducts}
          closeModal={onModalClose}
        />
      )}
    </>
  );
};

BondingList.propTypes = {
  bondingProgramType: PropTypes.string,
};

BondingList.defaultProps = {
  bondingProgramType: 'active',
};
