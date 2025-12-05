import {
  Alert,
  Button,
  Flex,
  Radio,
  RadioChangeEvent,
  Skeleton,
  Space,
  Steps,
  Typography,
} from 'antd';
import { AbiCoder, ZeroAddress, isAddress } from 'ethers';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Address, getAddress } from 'viem';
import { base, mainnet } from 'viem/chains';
import { DISCORD_CREATE_TICKET_URL } from 'libs/util-constants/src';
import { useAccount, useReadContract, useSwitchChain } from 'wagmi';

import { areAddressesEqual, notifyError } from '@autonolas/frontend-library';

import {
  CONTRIBUTE_MANAGER_ADDRESS_BASE,
  CONTRIBUTORS_V2_ABI,
  CONTRIBUTORS_V2_ADDRESS_BASE,
  SERVICE_REGISTRY_L2_ABI,
  SERVICE_REGISTRY_L2_ADDRESS_BASE,
} from 'common-util/AbiAndAddresses';
import { updateUserStakingData } from 'common-util/api';
import { ethersToWei, getAddressFromBytes32, truncateAddress } from 'common-util/functions';
import { updateLeaderboardUser } from 'store/setup';
import { LeaderboardUser } from 'store/types';
import {
  GOVERN_APP_URL,
  IS_STAKE_TEMPORARILY_DISABLED,
  OPERATE_APP_URL,
  STAKING_CONTRACTS_DETAILS,
} from 'util/constants';
import { useReadStakingContract, useServiceInfo } from 'util/staking';

import { ConnectTwitterModal } from '../ConnectTwitter/Modal';
import { WalletUpdateRequired } from './WalletUpdateRequired';
import { checkAndApproveOlasForAddress, checkHasEnoughOlas, createAndStake } from './requests';

const { Paragraph, Text } = Typography;

const STAKING_STEPS = {
  CONNECT_TWITTER: 0,
  SET_UP_AND_STAKE: 1,
  TWEET_AND_EARN: 2,
} as const;

const STAKING_CONTRACTS = Object.entries(STAKING_CONTRACTS_DETAILS)
  .filter(([_, values]) => !values.isDeprecated)
  .map(([key, values]) => ({
    id: key,
    ...values,
  }));

const ConnectTwitter = ({ account }: { account: string | null }) => {
  if (account) {
    return (
      <Text type="secondary">
        Your connected X account:{' '}
        <a href={`https://x.com/${account}`} target="_blank">
          @{account} ↗
        </a>
      </Text>
    );
  }
  return (
    <>
      <Paragraph type="secondary">Link your X account to your Contribute profile.</Paragraph>
      <ConnectTwitterModal />
    </>
  );
};

type StakingContractOptionProps = {
  contract: {
    address: Address;
    name: string;
    totalBond: number;
    pointsPerEpoch: number;
    maxSlots: number;
  };
};

const StakingContractOption = ({ contract }: StakingContractOptionProps) => {
  const { data, isLoading } = useReadStakingContract('getServiceIds', contract.address, base.id);

  const hasEnoughServiceSlots = useMemo(() => {
    if (!data) return false;
    if (data.length === contract.maxSlots) return false;
    return true;
  }, [contract.maxSlots, data]);

  return (
    <Radio value={contract.address} disabled={!hasEnoughServiceSlots || isLoading}>
      <Text className="font-weight-600">{contract.name}</Text>
      {isLoading ? (
        <Skeleton.Input size="small" className="ml-8" />
      ) : hasEnoughServiceSlots ? (
        <Text type="secondary">
          {` | ${contract.totalBond} OLAS stake | ${
            contract.pointsPerEpoch
          } point${contract.pointsPerEpoch > 1 ? 's' : ''} per epoch`}
        </Text>
      ) : (
        <Text type="secondary"> | No slots available</Text>
      )}
    </Radio>
  );
};

type SetUpAndStakeProps = {
  disabled: boolean;
  twitterId: string | null;
  multisigAddress: string | null;
  attributeId: number | null;
  onNextStep: () => void;
};
const SetUpAndStake = ({
  disabled,
  twitterId,
  multisigAddress,
  attributeId,
  onNextStep,
}: SetUpAndStakeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<Address | null>(null);
  const [multisig, setMultisig] = useState(multisigAddress);

  const dispatch = useDispatch();

  const { chainId, address: account } = useAccount();
  const { switchChainAsync, switchChain } = useSwitchChain();

  const { data: serviceInfo, isLoading: isServiceInfoLoading } = useServiceInfo({
    account,
    isNew: true,
  });

  useEffect(() => {
    if (multisigAddress) {
      setMultisig(multisigAddress);
    }
  }, [multisigAddress]);

  useEffect(() => {
    if (serviceInfo && !areAddressesEqual(serviceInfo.stakingInstance, ZeroAddress)) {
      setContract(serviceInfo.stakingInstance);
    }
  }, [serviceInfo]);

  useEffect(() => {
    // In case the service info wasn't written to DB, but the service was created,
    // try writing it again
    if (
      attributeId &&
      serviceInfo &&
      !areAddressesEqual(serviceInfo.multisig, ZeroAddress) &&
      !multisigAddress
    ) {
      updateUserStakingData({
        attributeId,
        multisig: serviceInfo.multisig,
        serviceId: Number(serviceInfo.serviceId),
      }).then((updatedAgent) => {
        if (updatedAgent) {
          dispatch(updateLeaderboardUser(updatedAgent));
        }

        setMultisig(serviceInfo.multisig);
      });
    }
  }, [serviceInfo, multisigAddress, twitterId, attributeId, dispatch]);

  const handleSelectContract = (e: RadioChangeEvent) => {
    setContract(e.target.value);
  };

  const handleSetUpAndStake = async () => {
    if (!account) return;
    if (!contract) return;
    if (!twitterId) return;
    if (!attributeId) return;

    const selectedContract = STAKING_CONTRACTS_DETAILS[contract];

    if (!selectedContract) return;
    if (selectedContract.isDeprecated) {
      notifyError('Selected contract is deprecated!');
      return;
    }

    setIsLoading(true);

    try {
      // Switch to base, where we have all the contribute staking contracts
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      const olasRequiredInWei = ethersToWei(`${selectedContract.totalBond}`);

      // Check that user has enough OLAS
      const hasEnoughOlas = await checkHasEnoughOlas({ account, amountInWei: olasRequiredInWei });
      if (!hasEnoughOlas) {
        notifyError("Error: you don't have enough OLAS to continue");
        return;
      }

      // Approve OLAS for Contributors contract
      await checkAndApproveOlasForAddress({
        account,
        addressToApprove: CONTRIBUTORS_V2_ADDRESS_BASE,
        amountToApprove: olasRequiredInWei,
      });

      // Create service and stake
      const result = await createAndStake({
        account,
        socialId: twitterId,
        stakingInstance: contract,
      });

      if (!result) return;

      const logs = result.logs;
      const createdAndStakedEvent = logs[logs.length - 1];

      // get all non-indexed inputs of CreatedAndStaked event
      const abiInputs =
        CONTRIBUTORS_V2_ABI.find(
          (item) => 'name' in item && item.name === 'CreatedAndStaked',
        )?.inputs.filter((item) => 'indexed' in item && !item.indexed) || [];
      // decode event data
      const decodedData = AbiCoder.defaultAbiCoder().decode(
        abiInputs.map((item) => item.type),
        createdAndStakedEvent.data,
      );
      // get serviceId from the decoded data
      const serviceId = Number(
        decodedData[abiInputs.findIndex((item) => item.name === 'serviceId')],
      );
      // get multisig address from event topics
      const multisig = getAddressFromBytes32(createdAndStakedEvent.topics[3] as string);

      // write multisig and serviceId to agent DB
      const updatedAgent = await updateUserStakingData({ attributeId, multisig, serviceId });
      if (updatedAgent) {
        dispatch(updateLeaderboardUser(updatedAgent));
      }

      setMultisig(multisig);
      onNextStep();
    } catch (error) {
      notifyError('Error: could not set up & stake');
      console.error(error);
    } finally {
      setIsLoading(false);

      // Suggest the user to switch back to mainnet to avoid any
      // further errors while they interact with the app
      if (chainId !== mainnet.id) {
        switchChain({ chainId: mainnet.id });
      }
    }
  };

  if (multisig) {
    const selectedContract = contract ? STAKING_CONTRACTS_DETAILS[contract] : null;
    return (
      <Flex vertical gap={8}>
        <Text type="secondary">
          Your staking contract:{' '}
          {isServiceInfoLoading && !selectedContract && <Skeleton.Input size="small" active />}
          {selectedContract && (
            <a href={`${GOVERN_APP_URL}/contracts/${contract}`} target="_blank">
              {selectedContract.name} ↗
            </a>
          )}
        </Text>
        <Text type="secondary">
          Your account address:{' '}
          <a href={`${base.blockExplorers.default.url}/address/${multisig}`} target="_blank">
            {truncateAddress(multisig)} ↗
          </a>
        </Text>
      </Flex>
    );
  }

  return (
    <>
      {!disabled && (
        <>
          <Radio.Group onChange={handleSelectContract} value={contract} className="mt-12 mb-12">
            <Space direction="vertical">
              {STAKING_CONTRACTS.map((item) => (
                <StakingContractOption
                  key={item.id}
                  contract={{
                    address: getAddress(item.id),
                    name: item.name,
                    totalBond: item.totalBond,
                    pointsPerEpoch: item.pointsPerEpoch,
                    maxSlots: item.maxSlots,
                  }}
                />
              ))}
            </Space>
          </Radio.Group>
          <a href={OPERATE_APP_URL} className="block mb-12" target="_blank">
            Explore contracts on Operate
          </a>
        </>
      )}
      <Paragraph type="secondary">
        You will need to sign two transactions with your wallet to complete this step. Ensure you
        have OLAS and ETH for gas on Base Chain.
      </Paragraph>
      <Button
        type="primary"
        disabled={disabled || !contract}
        loading={isLoading}
        onClick={handleSetUpAndStake}
      >
        {isLoading ? 'Setting up staking' : 'Set up & stake'}
      </Button>
    </>
  );
};

const TweetAndEarn = ({ disabled }: { disabled: boolean }) => {
  const { address } = useAccount();

  return (
    <>
      <Paragraph type="secondary">
        Visit your user profile page and participate in X post campaigns. If you post enough for the
        epoch, you might be eligible to earn staking rewards.
      </Paragraph>
      <Paragraph type="secondary">
        First epoch activity reward is proportional to the time between contributor registration and
        the end of the on-going epoch.
      </Paragraph>
      <Link href={`/profile/${address}`} passHref>
        <Button type="primary" disabled={disabled}>
          Visit user profile
        </Button>
      </Link>
    </>
  );
};

const StakeTemporarilyDisabledAlert = () => (
  <Alert
    type="warning"
    showIcon
    message={
      <Flex vertical gap={8}>
        <Text className="font-weight-600">Disruption for Beta staking contracts users!</Text>
        <Paragraph className="mb-16">
          Once this{' '}
          <a
            href={`${GOVERN_APP_URL}/proposals?proposalId=61092920434081846314634639695185450956263029379791193205240049323524867179380`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4"
          >
            DAO proposal&nbsp;↗
          </a>{' '}
          is executed, you will temporarily be unable to stake on Beta staking contracts.
        </Paragraph>
        <Paragraph>
          Visit the{' '}
          <a href={DISCORD_CREATE_TICKET_URL} target="_blank" rel="noopener noreferrer">
            Olas DAO&apos;s Discord Server&nbsp;↗
          </a>{' '}
          for more information.
        </Paragraph>
      </Flex>
    }
  />
);

export const StakingStepper = ({ profile }: { profile: LeaderboardUser | null }) => {
  const [step, setStep] = useState<number>(
    profile?.twitter_id ? STAKING_STEPS.SET_UP_AND_STAKE : STAKING_STEPS.CONNECT_TWITTER,
  );

  const handleNext = () => setStep((prev) => prev + 1);

  useEffect(() => {
    // The leaderboard is re-fetched at intervals in the background.
    // Based on the data updated, we can navigate to next step
    if (profile?.service_multisig) {
      setStep(STAKING_STEPS.TWEET_AND_EARN);
    } else if (profile?.twitter_id) {
      setStep(STAKING_STEPS.SET_UP_AND_STAKE);
    }
  }, [profile]);

  const { data: isWalletUpdateRequired, isLoading } = useReadContract({
    address: SERVICE_REGISTRY_L2_ADDRESS_BASE,
    abi: SERVICE_REGISTRY_L2_ABI,
    chainId: base.id,
    functionName: 'mapAgentInstanceOperators',
    args: profile?.wallet_address ? [getAddress(profile.wallet_address)] : [ZeroAddress as Address],
    query: {
      enabled: isAddress(profile?.wallet_address),
      select: (address) => {
        // Check if user's wallet is already engaged with contribute manager
        // meaning the user can't stake on new contracts and should switch the wallet
        return areAddressesEqual(address, CONTRIBUTE_MANAGER_ADDRESS_BASE);
      },
    },
  });

  return (
    <Flex gap={24} vertical>
      {isWalletUpdateRequired && <WalletUpdateRequired />}
      {IS_STAKE_TEMPORARILY_DISABLED && <StakeTemporarilyDisabledAlert />}
      <Flex>
        <Steps
          direction="vertical"
          size="small"
          current={step}
          items={[
            {
              title: <Text className="block mb-8">Connect X</Text>,
              description: <ConnectTwitter account={profile?.twitter_handle || null} />,
            },
            {
              title: (
                <Text className="block mb-8">
                  Select staking contract, set up on-chain account and stake funds
                </Text>
              ),
              description: (
                <SetUpAndStake
                  disabled={
                    IS_STAKE_TEMPORARILY_DISABLED ||
                    step !== STAKING_STEPS.SET_UP_AND_STAKE ||
                    isLoading ||
                    !!isWalletUpdateRequired
                  }
                  twitterId={profile?.twitter_id || null}
                  multisigAddress={profile?.service_multisig || null}
                  attributeId={profile?.attribute_id || null}
                  onNextStep={handleNext}
                />
              ),
            },
            {
              title: (
                <Text className="block mb-8">Post about Olas. Earn points. Earn rewards.</Text>
              ),
              description: <TweetAndEarn disabled={step !== STAKING_STEPS.TWEET_AND_EARN} />,
            },
          ]}
        />
      </Flex>
    </Flex>
  );
};
