import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import styled from 'styled-components';
import { mainnet } from 'viem/chains';
import { useAccount } from 'wagmi';

import { COLOR } from 'libs/ui-theme/src';
import { CHAIN_NAMES, EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';

import {
  CONTRACT_TEMPLATES,
  IMPLEMENTATION_ADDRESSES,
  isSupportedChainId,
} from 'common-util/constants/stakingContract';
import {
  createStakingContract,
  getErrorInfo,
  getIpfsHash,
  getStakingContractInitPayload,
  notifyConnectWallet,
  notifyWrongNetwork,
} from 'common-util/functions';
import { getChainIdFromPath } from 'common-util/hooks/useNetworkHelpers';
import { useAppSelector } from 'store/index';

const { Paragraph, Text } = Typography;

export const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
`;

export const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 24px;
`;

export const Hint = styled(Paragraph)`
  margin-top: 4px;
  font-size: 14px;
`;

export type FormValues = {
  name: string;
  description: string;
  maxNumServices: number;
  rewardsPerSecond: number;
};

export type ErrorType = { message: string; transactionHash?: string } | null;

export const TextWithTooltip = ({
  text,
  description,
}: {
  text: string;
  description: string | React.ReactNode;
}) => (
  <Tooltip color={COLOR.WHITE} title={<Paragraph className="m-0">{description}</Paragraph>}>
    <Text type="secondary">
      {text} <InfoCircleOutlined className="ml-4" />
    </Text>
  </Tooltip>
);

export const MaxNumServicesLabel = () => (
  <TextWithTooltip
    text="Maximum number of staked agents"
    description={
      <>
        How many agents do you need running? Agents can be sovereign or decentralized agents. They
        join the contract on a first come, first serve basis.
        <br />
        <a href="https://olas.network/learn" target="_blank">
          Learn more {UNICODE_SYMBOLS.EXTERNAL_LINK}
        </a>
      </>
    }
  />
);

export const RewardsPerSecondLabel = () => (
  <TextWithTooltip
    text="Rewards, OLAS per second"
    description="Token rewards come from the Olas protocol"
  />
);

export const WrongNetworkAlert = ({ networkId }: { networkId?: number | null }) => (
  <Alert
    className="mb-24"
    type="warning"
    showIcon
    message={`Your wallet is connected to the wrong network. Switch the wallet network to ${
      CHAIN_NAMES[networkId || mainnet.id]
    } to create a staking contract.`}
  />
);

export const ErrorAlert = ({
  error,
  networkId,
}: {
  error: NonNullable<ErrorType>;
  networkId?: number | null;
}) => (
  <Alert
    className="mb-24"
    type="error"
    showIcon
    message={
      <>
        {error.message}
        {error.transactionHash && (
          <>
            <br />
            <a
              href={`${[EXPLORER_URLS[networkId || mainnet.id]]}/tx/${error.transactionHash}`}
              target="_blank"
            >{`Explore transaction hash ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}</a>
          </>
        )}
      </>
    }
  />
);
