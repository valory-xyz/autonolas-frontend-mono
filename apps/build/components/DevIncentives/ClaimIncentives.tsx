import { Alert, Divider, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { COLOR, notifySuccess } from '@autonolas/frontend-library';
import { notifySpecificError } from 'common-util/functions/errors';
import { sortUnitIdsAndTypes } from 'common-util/functions/units';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { claimOwnerIncentivesRequest, getPausedValueRequest } from './requests';
import { DynamicFieldsForm } from '../DynamicFieldsForm';

const { Title } = Typography;

export const ClaimIncentives = () => {
  const { account } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [pauseValue, setPausedValue] = useState('0');

  useEffect(() => {
    const getData = async () => {
      try {
        const value = await getPausedValueRequest();
        setPausedValue(value);
      } catch (error) {
        notifySpecificError(error as Error);
        console.error(error);
      }
    };

    if (account) getData();
  }, [account]);

  const onClaimIncentivesSubmit = async (values: { unitIds: number[]; unitTypes: string[] }) => {
    try {
      setIsLoading(true);

      const [sortedUnitIds, sortedUnitTypes] = sortUnitIdsAndTypes(
        values.unitIds,
        values.unitTypes,
      );
      const params = {
        account: account as string,
        unitIds: sortedUnitIds.map((e) => `${e}`),
        unitTypes: sortedUnitTypes.map((e) => `${e}`),
      };

      await claimOwnerIncentivesRequest(params);
      notifySuccess('Rewards claimed');
    } catch (error) {
      notifySpecificError(error as Error);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {pauseValue === '0' ? null : (
        <>
          <Divider style={{ backgroundColor: COLOR.BORDER_GREY }} />

          <Title level={3}>Claim Rewards</Title>

          {pauseValue === '1' && (
            <>
              <Alert
                message="Note: You must be the owner of each listed unit to claim rewards."
                type="info"
                showIcon
                className="max-w-max"
              />

              <br />
              <DynamicFieldsForm
                isLoading={isLoading}
                onSubmit={onClaimIncentivesSubmit}
                submitButtonText="Claim Rewards"
              />
            </>
          )}

          {pauseValue === '2' && (
            <Alert
              message="Note: Rewards claiming is currently paused and will resume once the governance unpauses withdrawals."
              type="info"
              showIcon
              className="max-w-max"
            />
          )}
        </>
      )}
    </>
  );
};
