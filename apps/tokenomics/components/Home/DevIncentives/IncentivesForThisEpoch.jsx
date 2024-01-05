import { useState } from 'react';
import {
  Row, Col, Table, Typography, Alert,
} from 'antd';
import { round, toLower } from 'lodash';
import { notifyError } from '@autonolas/frontend-library';

import { FORM_TYPES, UNIT_TYPES } from 'util/constants';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';
import {
  notifySpecificError,
  parseToEth,
  sortUnitIdsAndTypes,
} from 'common-util/functions';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { getOwnerIncentivesRequest, getOwnersForUnits } from './requests';
import { RewardAndTopUpContainer } from './styles';

const { Title } = Typography;

const columns = [
  {
    title: 'Reward (ETH)',
    dataIndex: 'reward',
    key: 'reward',
  },
  {
    title: 'Top Up (OLAS)',
    dataIndex: 'topUp',
    key: 'topUp',
  },
];

const checkIfHasDuplicate = (unitIds, unitTypes) => {
  const agentIds = unitIds.filter(
    (e, index) => unitTypes[index] === UNIT_TYPES.AGENT,
  );
  const componentIds = unitIds.filter(
    (e, index) => unitTypes[index] === UNIT_TYPES.COMPONENT,
  );

  const uniqueAgentIds = [...new Set(agentIds)];
  const uniqueComponentIds = [...new Set(componentIds)];

  if (uniqueAgentIds.length !== agentIds.length) {
    return true;
  }

  if (uniqueComponentIds.length !== componentIds.length) {
    return true;
  }

  return false;
};

export const IncentivesForThisEpoch = () => {
  const { account } = useHelpers();

  // fetch incentives state
  const [isLoading, setIsLoading] = useState(false);
  const [rewardAndTopUp, setRewardAndTopUp] = useState([]);

  const getIncentives = async (values) => {
    setIsLoading(true);
    const address = values.address || account;
    const unitIds = values.unitIds.map((e) => `${e}`);
    const unitTypes = values.unitTypes.map((e) => `${e}`);

    // check if there are duplicate unit ids
    if (checkIfHasDuplicate(unitIds, unitTypes)) {
      notifyError('Please input unique unit IDs.');
      setIsLoading(false);
      return;
    }

    const indexesWithDifferentOwner = [];

    // fetch owners for each unit
    getOwnersForUnits({ unitIds, unitTypes })
      .then(async (owners) => {
        // check if the owner of each unit is the same as the address input
        owners.forEach((e, index) => {
          if (toLower(e) !== toLower(address)) {
            indexesWithDifferentOwner.push(index);
          }
        });

        // if there are units with different owner, notify error
        // (because only owners can see the incentives)
        if (indexesWithDifferentOwner.length !== 0) {
          const ids = indexesWithDifferentOwner
            .map((e) => {
              const type = unitTypes[e] === UNIT_TYPES.AGENT ? 'Agent ID' : 'Component ID';
              return `${type} ${unitIds[e]}`;
            })
            .join(', ');

          notifyError(
            'Provided address is not the owner of the following units: ',
            ids,
          );
        } else {
          const [sortedUnitIds, sortedUnitTypes] = sortUnitIdsAndTypes(
            unitIds,
            unitTypes,
          );

          try {
            const params = {
              address,
              unitIds: sortedUnitIds,
              unitTypes: sortedUnitTypes,
            };
            const response = await getOwnerIncentivesRequest(params);

            // set reward and top up for table
            setRewardAndTopUp([
              {
                key: '1',
                reward: round(parseToEth(response.reward), 6),
                topUp: round(parseToEth(response.topUp), 6),
              },
            ]);
          } catch (error) {
            // reset reward and top up & notify error
            setRewardAndTopUp([]);
            notifySpecificError(error);

            console.error(error);
          } finally {
            setIsLoading(false);
          }
        }
      })
      .catch((ownersForUnitsError) => {
        notifyError('Error occured on fetching owners for units');
        console.error(ownersForUnitsError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      <Title level={3}>Check for available rewards</Title>

      <Alert
        message="Note: The specified address must be the owner of all the listed units in order to see the claimable rewards"
        type="info"
        showIcon
      />
      <br />

      <Row>
        <Col lg={14} xs={24}>
          <DynamicFieldsForm
            dynamicFormType={FORM_TYPES.CLAIMABLE_INCENTIVES}
            isLoading={isLoading}
            onSubmit={getIncentives}
            submitButtonText="Check Rewards"
          />
        </Col>

        <Col lg={10} xs={24}>
          {rewardAndTopUp.length > 0 && (
            <RewardAndTopUpContainer>
              <Table
                columns={columns}
                dataSource={rewardAndTopUp}
                bordered
                pagination={false}
              />
            </RewardAndTopUpContainer>
          )}
        </Col>
      </Row>
    </>
  );
};
