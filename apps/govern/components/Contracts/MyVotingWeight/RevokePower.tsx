import { Alert, Button, Flex, Modal, notification, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

import { CHAIN_NAMES, EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import { AddressLink } from 'libs/ui-components/src';
import { Address } from 'viem';
import { useAccount } from 'wagmi';
import { revokePower } from 'common-util/functions';
import { INVALIDATE_AFTER_USER_DATA_CHANGE } from 'common-util/constants/scopeKeys';
import { useAppDispatch } from 'store/index';
import { resetState } from 'common-util/functions/resetState';
import { clearUserState } from 'store/govern';
import { Nominee } from 'types';
import { areAddressesEqual, getAddressFromBytes32 } from 'libs/util-functions/src';

const { Text, Paragraph } = Typography;

type Statuses = Record<
  Address,
  {
    isLoading: boolean;
    isDisabled: boolean;
    transactionHash?: string;
  }
>;

const columns = (
  statuses: Statuses,
  onRevoke: (address: Address, chainId: number) => void,
): ColumnsType<Nominee> => [
  {
    title: 'Contract address',
    key: 'account',
    dataIndex: 'account',
    render: (account, record) => (
      <AddressLink address={getAddressFromBytes32(account)} chainId={Number(record.chainId)} />
    ),
  },
  {
    title: 'Chain',
    key: 'chainId',
    dataIndex: 'chainId',
    render: (chainId) => <Text type="secondary">{CHAIN_NAMES[chainId] || chainId}</Text>,
  },
  {
    title: 'Action',
    key: 'action',
    width: 130,
    render: (_, record) => {
      const contractStatus = statuses[record.account];

      if (!contractStatus) {
        return <Text type="danger">Error</Text>;
      }

      if (contractStatus.transactionHash) {
        return (
          <a
            href={`${EXPLORER_URLS[Number(record.chainId)]}/tx/${contractStatus.transactionHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {`Txn details ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
          </a>
        );
      }

      return (
        <Button
          loading={contractStatus.isLoading}
          disabled={contractStatus.isDisabled}
          onClick={() => onRevoke(record.account, Number(record.chainId))}
          size="small"
          type="primary"
        >
          Revoke
        </Button>
      );
    },
  },
];

type RevokePowerProps = { contracts: Nominee[] };

export const RevokePower = ({ contracts }: RevokePowerProps) => {
  const dispatch = useAppDispatch();
  const { address: account } = useAccount();
  const [contractsStatuses, setContractsStatuses] = useState(
    contracts.reduce((res, item) => {
      res[item.account] = {
        isLoading: false,
        isDisabled: false,
      };

      return res;
    }, {} as Statuses),
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const closeModal = () => {
    // if revoke was called for some of the contracts,
    // reset user's data on modal close
    if (Object.values(contractsStatuses).some((item) => !!item.transactionHash)) {
      resetState(INVALIDATE_AFTER_USER_DATA_CHANGE, dispatch, clearUserState);
    }
    setIsModalOpen(false);
  };

  const handleRevoke = async (removedNominee: Address, chainId: number) => {
    if (!account) return;

    // Set loading state for the provided contract
    // and disable the rest
    let statuses = Object.keys(contractsStatuses).reduce(
      (res, address) => {
        if (areAddressesEqual(address, removedNominee)) {
          res[address as Address].isLoading = true;
        } else {
          res[address as Address].isDisabled = true;
        }
        return res;
      },
      { ...contractsStatuses },
    );
    setContractsStatuses(statuses);

    // Vote
    revokePower({ account, nominee: removedNominee, chainId })
      .then((result) => {
        notification.success({
          message: 'You have revoked your power.',
        });

        // Update statuses with txn hash for the provided nominee
        statuses = Object.keys(statuses).reduce(
          (res, address) => {
            if (
              areAddressesEqual(address, removedNominee) &&
              typeof result?.transactionHash === 'string'
            ) {
              res[address as Address].transactionHash = result.transactionHash;
            }
            return res;
          },
          { ...statuses },
        );
      })
      .catch((error) => {
        notification.error({
          message: error.message,
        });
      })
      .finally(() => {
        // Reset loading and disabled states for statuses
        statuses = Object.keys(statuses).reduce(
          (res, address) => {
            res[address as Address] = {
              ...res[address as Address],
              isLoading: false,
              isDisabled: false,
            };
            return res;
          },
          { ...statuses },
        );
        setContractsStatuses(statuses);
      });
  };

  return (
    <>
      <Alert
        type="warning"
        showIcon
        message={
          <Flex vertical gap={8} align="start">
            <Text className="font-weight-600">
              Some of your voted contracts removed from Olas Staking
            </Text>
            <Paragraph className="m-0 mb-8">
              You must revoke voting power from these contracts before updating your voting weight.
            </Paragraph>
            <Button size="small" onClick={showModal}>
              Review contracts
            </Button>
          </Flex>
        }
      />
      <Modal title="Revoke voting power" open={isModalOpen} onCancel={closeModal} footer={null}>
        <Paragraph>
          The following contracts have been removed from Olas Staking. <br />
          Revoke your votes from each one to free up your voting weight.
        </Paragraph>
        <Table<Nominee>
          className="mt-16"
          columns={columns(contractsStatuses, handleRevoke)}
          dataSource={contracts}
          pagination={false}
          rowKey={(record) => record.account}
        />
      </Modal>
    </>
  );
};
