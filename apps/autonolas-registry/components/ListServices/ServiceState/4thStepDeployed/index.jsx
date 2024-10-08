import { Space, Table } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { AddressLink } from '@autonolas/frontend-library';

import { SendTransactionButton } from 'common-util/TransactionHelpers/SendTransactionButton';
import { useHelpers } from 'common-util/hooks/useHelpers';
import { useScreen } from 'common-util/hooks/useScreen';

import { setAgentInstancesAndOperators } from '../../../../store/service';
import { useAgentInstanceAndOperator } from '../../hooks/useSvmService';
import { getAgentInstanceAndOperator } from '../utils';

export const Deployed = ({
  serviceId,
  multisig,
  isShowAgentInstanceVisible,
  currentStep,
  isOwner,
  getButton,
  getOtherBtnProps,
  handleTerminate,
}) => {
  const dispatch = useDispatch();
  const { account, chainId, isSvm, chainName } = useHelpers();
  const { isMobile } = useScreen();
  const data = useSelector((state) => state?.service?.agentInstancesAndOperators);
  const [isTerminating, setIsTerminating] = useState(false);
  const { getSvmAgentInstanceAndOperator } = useAgentInstanceAndOperator();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      // fetch agent instances and operators if service state is moved to step 4
      if (serviceId || currentStep === 3) {
        const tempData = isSvm
          ? await getSvmAgentInstanceAndOperator(serviceId)
          : await getAgentInstanceAndOperator(serviceId);
        if (isMounted) {
          dispatch(setAgentInstancesAndOperators(tempData));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [serviceId, chainId, isSvm, currentStep, dispatch, getSvmAgentInstanceAndOperator]);

  const onTerminate = async () => {
    try {
      setIsTerminating(true);
      await handleTerminate(account, serviceId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTerminating(false);
    }
  };

  const addressLinkProps = useMemo(
    () => ({
      chainId,
      chainName,
      suffixCount: isMobile ? 4 : 6,
    }),
    [chainName, isMobile, chainId],
  );

  return (
    <div className="step-4-deployed" data-testid="step-deployed">
      <Space direction="vertical" size={10} className="full-width">
        {isShowAgentInstanceVisible && (
          <Table
            dataSource={data}
            pagination={false}
            bordered
            rowKey="id"
            columns={[
              {
                title: 'Agent Instances',
                dataIndex: 'agentInstance',
                key: 'agentInstance',
                render: (text) => <AddressLink text={text} {...addressLinkProps} />,
                width: '50%',
              },
              {
                title: 'Operators',
                dataIndex: 'operatorAddress',
                key: 'operatorAddress',
                render: (text) => <AddressLink text={text} {...addressLinkProps} />,
                width: '50%',
              },
            ]}
          />
        )}
        <div>
          {`${isSvm ? 'Squads' : 'Safe'} contract address:`}
          <AddressLink text={multisig} {...addressLinkProps} />
        </div>
        {getButton(
          <SendTransactionButton
            onClick={onTerminate}
            loading={isTerminating}
            {...getOtherBtnProps(4, { isDisabled: !isOwner })}
          >
            Terminate
          </SendTransactionButton>,
          { step: 4 },
        )}
      </Space>
    </div>
  );
};

Deployed.propTypes = {
  serviceId: PropTypes.string,
  multisig: PropTypes.string.isRequired,
  isShowAgentInstanceVisible: PropTypes.bool,
  currentStep: PropTypes.number.isRequired,
  getButton: PropTypes.func.isRequired,
  getOtherBtnProps: PropTypes.func.isRequired,
  updateDetails: PropTypes.func.isRequired,
  isOwner: PropTypes.bool,
  handleTerminate: PropTypes.func.isRequired,
};

Deployed.defaultProps = {
  serviceId: null,
  isShowAgentInstanceVisible: false,
  isOwner: false,
};
