import { InfoCircleOutlined } from '@ant-design/icons';
import { readContract } from '@wagmi/core';
import { Alert, Tooltip, Typography, notification } from 'antd';
import { ethers } from 'ethers';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';

import { COLOR } from 'libs/ui-theme/src';
import { CHAIN_NAMES, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { STAKING_FACTORY, STAKING_VERIFIER } from 'libs/util-contracts/src/lib/abiAndAddresses';

import { wagmiConfig } from 'common-util/config/wagmi';

const { Paragraph, Text } = Typography;

export type FormValues = {
  name: string;
  description: string;
  maxNumServices: number;
  rewardsPerSecond: number;
};

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

// Checks if implementation is verified
export const checkImplementationVerified = async (chainId: number, implementation: Address) => {
  const verifierAddress = (await readContract(wagmiConfig, {
    abi: STAKING_FACTORY.abi,
    address: (STAKING_FACTORY.addresses as Record<number, Address>)[chainId],
    chainId,
    functionName: 'verifier',
  })) as Address;

  if (verifierAddress === ethers.ZeroAddress) return true;

  const result = await readContract(wagmiConfig, {
    abi: STAKING_VERIFIER.abi,
    address: verifierAddress,
    chainId,
    functionName: 'verifyImplementation',
    args: [implementation],
  });

  if (!result) {
    notification.error({ message: 'Selected implementation is not verified' });
  }

  return result;
};

export const NAME_FIELD_RULES = [{ required: true, message: 'Please enter Name' }];
export const DESCRIPTION_FIELD_RULES = [{ required: true, message: 'Please enter Description' }];
export const MAX_NUM_SERVICES_FIELD_RULES = [
  { required: true, message: 'Please enter Maximum number of staked agents' },
];
export const REWARDS_PER_SECOND_FIELD_RULES = [
  { required: true, message: 'Please enter Rewards per second' },
];
