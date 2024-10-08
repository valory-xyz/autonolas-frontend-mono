import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Empty, Radio, Table, Tooltip, Typography } from 'antd';
import { round } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

import { getFormattedDate, notifyError, notifySuccess } from '@autonolas/frontend-library';

import { COLOR } from 'libs/ui-theme/src';

import { parseToEth } from 'common-util/functions/ethers';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { getAllBondsRequest, redeemRequest } from './requests';

const { Title } = Typography;

const getBondsColumns = () => {
  const columns = [
    {
      title: 'Payout in OLAS',
      dataIndex: 'payout',
      key: 'payout',
      render: (value) => {
        const parseValue = parseToEth(value);
        return (
          <Tooltip title={parseValue} placement="right">
            {round(parseValue, 4)}
          </Tooltip>
        );
      },
    },
    {
      title: 'Matured?',
      dataIndex: 'matured',
      key: 'matured',
      render: (value) =>
        value ? (
          <CheckOutlined style={{ color: COLOR.PRIMARY, fontSize: 24 }} />
        ) : (
          <CloseOutlined style={{ color: COLOR.RED, fontSize: 24 }} />
        ),
    },
    {
      title: 'Maturity Date',
      dataIndex: 'maturityDate',
      key: 'maturityDate',
      render: (value) => (value ? getFormattedDate(value) : '--'),
    },
  ];

  return columns;
};

const BONDS = {
  MATURED: 'matured',
  NOT_MATURED: 'not-matured',
};

export const MyBonds = () => {
  const { account, chainId } = useHelpers();
  const [maturityType, setMaturityType] = useState(BONDS.NOT_MATURED);
  const [isLoading, setIsLoading] = useState(false);
  const [maturedBondList, setMaturedBondList] = useState([]);
  const [nonMaturedBondList, setNonMaturedBondList] = useState([]);
  const [selectedBondIds, setSelectedBondIds] = useState([]);

  const getBondsListHelper = useCallback(async () => {
    try {
      setIsLoading(true);

      const { maturedBonds, nonMaturedBonds } = await getAllBondsRequest({
        account,
      });
      setMaturedBondList(maturedBonds);
      setNonMaturedBondList(nonMaturedBonds);
    } catch (error) {
      window.console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // on load, get the list of bonds & set the maturity type radio button
  useEffect(() => {
    const getData = async () => {
      try {
        setIsLoading(true);

        const { maturedBonds, nonMaturedBonds } = await getAllBondsRequest({
          account,
        });
        setMaturedBondList(maturedBonds);
        setNonMaturedBondList(nonMaturedBonds);

        setMaturityType(maturedBonds.length > 0 ? BONDS.MATURED : BONDS.NOT_MATURED);
      } catch (error) {
        window.console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (account && chainId) {
      getData();
    }
  }, [account, chainId]);

  // on maturity type change
  useEffect(() => {
    if (account && chainId) {
      getBondsListHelper();
    }
  }, [account, chainId, maturityType, getBondsListHelper]);

  const onRedeem = async () => {
    try {
      await redeemRequest({ account, bondIds: selectedBondIds });
      notifySuccess('Redeemed successfully');

      // update the list once the bond is redeemed
      setSelectedBondIds([]);
      await getBondsListHelper();
    } catch (error) {
      notifyError('Error while redeeming');
      console.error(error);
    }
  };

  return (
    <div>
      <Title level={2} className="mt-0 choose-type-group">
        My Bonds
        <Radio.Group
          onChange={(e) => setMaturityType(e.target.value)}
          value={account ? maturityType : null}
          disabled={isLoading || !account}
        >
          <Radio value={BONDS.MATURED}>Matured</Radio>
          <Radio value={BONDS.NOT_MATURED}>Not Matured</Radio>
        </Radio.Group>
      </Title>
      <ConfigProvider
        renderEmpty={() => {
          const getDesc = () => {
            if (isLoading) {
              return 'Loading bonds...';
            }
            if (!account) {
              return 'Please connect your wallet';
            }
            return 'No bonds found';
          };

          return <Empty description={getDesc()} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }}
      >
        <Table
          columns={getBondsColumns()}
          dataSource={maturityType === BONDS.MATURED ? maturedBondList : nonMaturedBondList}
          bordered
          loading={isLoading}
          pagination={false}
          scroll={{ x: 400 }}
          rowKey="bondId"
          rowSelection={
            maturityType === BONDS.MATURED
              ? {
                  type: 'checkbox',
                  selectedRowKeys: selectedBondIds,
                  onChange: (selectedRowKeys) => {
                    setSelectedBondIds(selectedRowKeys);
                  },
                  // disable the checkbox if the bond is not matured
                  getCheckboxProps: (record) => ({
                    disabled: !record.matured,
                  }),
                }
              : undefined
          }
          rowHoverable={false}
        />
      </ConfigProvider>

      {maturityType === BONDS.MATURED && (
        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <Button
            size="large"
            disabled={!account || selectedBondIds.length === 0}
            type="primary"
            onClick={onRedeem}
          >
            Redeem
          </Button>
        </div>
      )}
    </div>
  );
};
