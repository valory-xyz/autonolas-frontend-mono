import {
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
  Typography,
} from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { mainnet } from 'viem/chains';
import { useAccount } from 'wagmi';

import { CHAIN_NAMES, EXPLORER_URLS, UNICODE_SYMBOLS } from 'libs/util-constants/src';
import { notifyWarning } from 'libs/util-functions/src';

import { ErrorAlert } from 'common-util/ErrorAlert';
import {
  CONTRACT_DEFAULT_VALUES,
  CONTRACT_TEMPLATES,
  IMPLEMENTATION_ADDRESSES,
  isSupportedChainId,
} from 'common-util/constants/stakingContract';
import { URL } from 'common-util/constants/urls';
import { Feature, createStakingContract, getErrorInfo, getIpfsHash } from 'common-util/functions';
import { getChainIdFromPath } from 'common-util/functions/networkHelpers';
import { getStakingContractInitPayload } from 'common-util/functions/stakingContract';
import { useAppDispatch } from 'store/index';
import { addStakingContract } from 'store/launch';
import { ErrorType } from 'types/index';

import {
  ActivityCheckerAddressLabel,
  AgentIdsLabel,
  ServiceConfigHashLabel,
  DescriptionLabel,
  FormValues,
  LABELS,
  LivenessPeriodLabel,
  MaximumInactivityPeriodsLabel,
  MaximumStakedAgentsLabel,
  MinimumStakingPeriodsLabel,
  MinimumStakingDepositLabel,
  NameLabel,
  AgentInstancesLabel,
  RewardsPerSecondLabel,
  TemplateInfo,
  MultisigThresholdLabel,
  TimeForEmissionsLabel,
  getFieldRules,
} from '../FormLabels';
import { Hint, StyledMain, Title } from './styles';
import { WrongNetworkAlert, checkImplementationVerified } from './utils';

const { Text } = Typography;

const contractTemplate = CONTRACT_TEMPLATES[0];
const INPUT_WIDTH_STYLE = { width: '100%' };

export const CreateStakingContract = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorType>(null);
  const params = useParams<{ network: string }>();
  const networkName = params?.network as string;

  const { address: account, chain } = useAccount();

  const networkId = getChainIdFromPath(networkName);
  const wrongNetwork = chain && networkId ? networkId !== chain.id : false;

  const handleCreate = async (values: FormValues) => {
    if (!account) {
      notifyWarning('Please connect your wallet');
      return;
    }

    if (!chain?.id) return;

    if (!isSupportedChainId(chain.id)) {
      throw new Error('Network not supported');
    }

    if (wrongNetwork) {
      notifyWarning('Please switch to the correct network and try again');
      return;
    }

    setError(null);
    setIsLoading(true);

    const {
      contractName,
      description,
      maxNumServices,
      rewardsPerSecond,
      minStakingDeposit,
      minNumStakingPeriods,
      maxNumInactivityPeriods,
      livenessPeriod,
      timeForEmissions,
      numAgentInstances,
      agentIds,
      threshold,
      configHash,
      activityChecker,
    } = values;

    try {
      const metadataHash = await getIpfsHash({ name: contractName, description });

      const initPayload = getStakingContractInitPayload({
        metadataHash,
        maxNumServices,
        rewardsPerSecond,
        minStakingDeposit,
        minNumStakingPeriods,
        maxNumInactivityPeriods,
        livenessPeriod,
        timeForEmissions,
        numAgentInstances,
        agentIds,
        threshold,
        configHash,
        activityChecker,
        chainId: chain.id,
      });
      console.log('initPayload: ', initPayload);

      const implementation = IMPLEMENTATION_ADDRESSES[chain.id];
      console.log('implementation: ', implementation);

      // Validations
      if (!(await checkImplementationVerified(chain.id, implementation))) {
        throw new Error('Validation failed');
      }
      console.log('account: ', account);

      const result = await createStakingContract({ implementation, initPayload, account });
      console.log('createStakingContract result: ', result);

      if (result) {
        const eventLog = result.events?.InstanceCreated?.returnValues;
        console.log('eventLog: ', eventLog);

        if (eventLog) {
          dispatch(
            addStakingContract({
              id: eventLog.instance,
              chainId: chain.id,
              name: contractName,
              description,
              template: contractTemplate.title,
              isNominated: false,
            }),
          );
        }
        router.push(`/${networkName}/${URL.myStakingContracts}`);
      }
    } catch (error) {
      console.log(error);

      const { message, transactionHash } = getErrorInfo(Feature.CREATE, error as Error);
      setError({ message, transactionHash });
    } finally {
      setIsLoading(false);
    }
  };

  const alertMessage = useMemo(() => {
    if (wrongNetwork) return <WrongNetworkAlert networkId={networkId} />;
    if (error) return <ErrorAlert error={error} networkId={networkId} />;
    return null;
  }, [wrongNetwork, error, networkId]);

  return (
    <StyledMain>
      <Card>
        <Title>Create staking contract on {CHAIN_NAMES[networkId || mainnet.id]}</Title>

        {alertMessage}

        <Form
          layout="vertical"
          onFinish={handleCreate}
          requiredMark={false}
          initialValues={{ ...CONTRACT_DEFAULT_VALUES }}
        >
          <Form.Item
            label={<NameLabel />}
            name="contractName"
            rules={getFieldRules(LABELS.contractName.name)}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={<DescriptionLabel />}
            name="description"
            className="mb-0"
            rules={getFieldRules(LABELS.description.name)}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Hint type="secondary">
            Good descriptions help governors understand the value your contract brings to the
            ecosystem. Be clear to increase the chance governors allocate rewards to your contract.
          </Hint>

          <Divider />
          <TemplateInfo />
          <Flex className="mt-4 mb-8" gap={16}>
            <Text>{contractTemplate.title}</Text>
            <Tag color="default">More templates coming soon</Tag>
          </Flex>
          <Flex className="mb-8">
            <Text type="secondary">{contractTemplate.description}</Text>
          </Flex>
          <Button
            type="link"
            className="p-0 mb-16"
            href={`${EXPLORER_URLS[networkId || mainnet.id]}/address/TBD`}
          >
            {`View template on explorer ${UNICODE_SYMBOLS.EXTERNAL_LINK}`}
          </Button>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={<MaximumStakedAgentsLabel />}
                name="maxNumServices"
                rules={getFieldRules(LABELS.maxNumServices.name)}
              >
                <InputNumber placeholder="e.g. 100" step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<RewardsPerSecondLabel />}
                name="rewardsPerSecond"
                rules={LABELS.rewardsPerSecond.rules}
              >
                <InputNumber placeholder="e.g. 0.000001649305555557" step="0.0001" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={<MinimumStakingDepositLabel />}
                name="minStakingDeposit"
                rules={LABELS.minStakingDeposit.rules}
              >
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<MinimumStakingPeriodsLabel />}
                name="minNumStakingPeriods"
                rules={LABELS.minNumStakingPeriods.rules}
              >
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={<MaximumInactivityPeriodsLabel />}
                name="maxNumInactivityPeriods"
                rules={LABELS.maxNumInactivityPeriods.rules}
              >
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<LivenessPeriodLabel />}
                name="livenessPeriod"
                rules={LABELS.livenessPeriod.rules}
              >
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={<TimeForEmissionsLabel />}
                name="timeForEmissions"
                rules={LABELS.timeForEmissions.rules}
              >
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<AgentInstancesLabel />}
                name="numAgentInstances"
                rules={LABELS.numAgentInstances.rules}
              >
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label={<AgentIdsLabel />} name="agentIds">
                <Input style={INPUT_WIDTH_STYLE} placeholder="14,25" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<MultisigThresholdLabel />} name="threshold">
                <InputNumber step="1" style={INPUT_WIDTH_STYLE} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<ServiceConfigHashLabel />} name="configHash">
            <Input />
          </Form.Item>
          <Form.Item
            label={<ActivityCheckerAddressLabel />}
            name="activityChecker"
            rules={LABELS.activityChecker.rules}
          >
            <Input />
          </Form.Item>

          <Flex justify="end" gap={12}>
            <Link href={`/${networkName}/${URL.myStakingContracts}`} passHref>
              <Button size="large">Cancel</Button>
            </Link>
            <Button size="large" type="primary" htmlType="submit" loading={isLoading}>
              Create contract
            </Button>
          </Flex>
        </Form>
      </Card>
    </StyledMain>
  );
};
