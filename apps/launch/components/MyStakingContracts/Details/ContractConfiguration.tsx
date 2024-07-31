import { Row, Skeleton, Typography } from 'antd';
import { FC, ReactNode } from 'react';
import { Address } from 'viem';

import { NA } from '@autonolas/frontend-library';

import { EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { truncateAddress } from 'libs/util-functions/src';

import {
  useGetActivityChecker,
  useGetLivenessPeriod,
  useGetMinimumStakingDeposit,
} from 'hooks/useGetStakingConstants';
import { useAppSelector } from 'store/index';
import { MyStakingContract } from 'types/index';

import {
  ActivityCheckerAddressLabel, // AgentIdsLabel,
  // AgentInstancesLabel,
  LivenessPeriodLabel,
  MaximumInactivityPeriodsLabel,
  MaximumStakedAgentsLabel,
  MinimumStakingDepositLabel,
  MinimumStakingPeriodsLabel, // MultisigThresholdLabel,
  RewardsPerSecondLabel, // ServiceConfigHashLabel,
  // TimeForEmissionsLabel,
} from '../FormLabels';
import { ColFlexContainer } from './helpers';
import { useMaxNumServices, useRewardsPerSecond } from './hooks';

const { Text } = Typography;

const ShowContent = ({ isLoading, data }: { isLoading: boolean; data?: string | ReactNode }) => {
  const { networkId } = useAppSelector((state) => state.network);

  if (!networkId || isLoading) return <Skeleton.Input active size="small" />;
  return <Text>{data || NA}</Text>;
};

const MaximumStakedAgents: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useMaxNumServices({ address });
  return <ShowContent isLoading={isLoading} data={data} />;
};

const Rewards: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useRewardsPerSecond({ address });
  return <ShowContent isLoading={isLoading} data={`${data} OLAS` || NA} />;
};

const MinimumStakingDeposit: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetMinimumStakingDeposit({ address });
  console.log('MinimumStakingDeposit', data);
  return <ShowContent isLoading={isLoading} data={data} />;
};

const LivenessPeriod: FC<{ address: Address }> = ({ address }) => {
  const { data, isLoading } = useGetLivenessPeriod({ address });
  return <ShowContent isLoading={isLoading} data={data ? `${data} seconds` : NA} />;
};

const ActivityCheckerAddress: FC<{ address: Address }> = ({ address }) => {
  const { networkId } = useAppSelector((state) => state.network);
  const { data: checkerAddress, isLoading } = useGetActivityChecker({ address });
  const truncatedAddress = checkerAddress ? truncateAddress(checkerAddress) : NA;

  return (
    <ShowContent
      isLoading={isLoading}
      data={
        networkId ? (
          <a
            href={`${EXPLORER_URLS[networkId]}/address/${checkerAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${truncatedAddress} ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
          </a>
        ) : null
      }
    />
  );
};

export const ContractConfiguration: FC<{ myStakingContract: MyStakingContract }> = ({
  myStakingContract,
}) => {
  return (
    <>
      <Row gutter={24}>
        <ColFlexContainer
          text={<MaximumStakedAgentsLabel />}
          content={<MaximumStakedAgents address={myStakingContract.id} />}
        />
        <ColFlexContainer
          text={<RewardsPerSecondLabel />}
          content={<Rewards address={myStakingContract.id} />}
        />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer
          text={<MinimumStakingDepositLabel />}
          content={<MinimumStakingDeposit address={myStakingContract.id} />}
        />
        <ColFlexContainer text={<MinimumStakingPeriodsLabel />} content={<>TODO</>} />
      </Row>

      <Row gutter={24}>
        <ColFlexContainer text={<MaximumInactivityPeriodsLabel />} content={<>TODO</>} />
        <ColFlexContainer
          text={<LivenessPeriodLabel />}
          content={<LivenessPeriod address={myStakingContract.id} />}
        />
      </Row>

      {/* <Row gutter={24}>
        <ColFlexContainer text={<TimeForEmissionsLabel />} content={<>TODO</>} />
        <ColFlexContainer text={<AgentInstancesLabel />} content={<>TODO</>} />
      </Row> */}

      {/* <Row gutter={24}>
        <ColFlexContainer text={<AgentIdsLabel />} content={<>TODO</>} />
        <ColFlexContainer text={<MultisigThresholdLabel />} content={<>TODO</>} />
      </Row> */}

      <Row gutter={24}>
        {/* <ColFlexContainer text={<ServiceConfigHashLabel />} content={<>TODO</>} /> */}
        <ColFlexContainer
          text={<ActivityCheckerAddressLabel />}
          content={<ActivityCheckerAddress address={myStakingContract.id} />}
        />
      </Row>
    </>
  );
};
