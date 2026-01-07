import ShrinkOutlined from '@ant-design/icons/ShrinkOutlined';
import { Button, Grid, Statistic, Typography } from 'antd';
import { isNil, isUndefined } from 'lodash';
import { ReactNode, useEffect, useState } from 'react';

import { MinimizedStatus } from './helpers/MinimizedStatus';
import { PoweredBy, PoweredByForSmallDevice } from './helpers/PoweredBySvg';
import {
  Badge,
  ContractsInfoContainer,
  ExtraContent,
  MobileOffChainContainer,
  NextUpdateTimer,
  OffChainContainer,
} from './styles';
import { AppType } from './types';
import { DotSpace, LinksSection } from './utils';

const { Text } = Typography;
const { Countdown } = Statistic;
const { useBreakpoint } = Grid;

type ServiceStatusInfoDetails = {
  isHealthy?: boolean;
  /**
   * seconds left to next update in seconds
   */
  secondsLeftReceived?: number;
  appType?: AppType;
  extra?: ReactNode;
  /**
   * extra content to be displayed on mobile size.
   * if not defined, will use the same content as `extra`
   */
  extraMd?: ReactNode;
  onTimerFinish?: () => void;
  onMinimizeToggle?: (isMinimized: boolean) => void;
  // if true, will be maximized by default
  isDefaultMaximized?: boolean;
};

const timerStyle = { minWidth: '36px' };
const Dash = () => <span style={{ display: 'inline-block', ...timerStyle }}>--</span>;

export const ServiceStatusInfo = ({
  isHealthy,
  secondsLeftReceived,
  appType,
  extra,
  extraMd,
  onTimerFinish,
  onMinimizeToggle,
  isDefaultMaximized = false,
}: ServiceStatusInfoDetails) => {
  const screens = useBreakpoint();
  const canMinimize = !screens.xl;
  const [isMinimized, setIsMinimized] = useState<boolean>(!isDefaultMaximized);
  const [seconds, setSeconds] = useState<number | undefined>(0);
  const [countdownKey, setCountdownKey] = useState<number>(0);

  useEffect(() => {
    if (!isUndefined(secondsLeftReceived)) {
      setSeconds(secondsLeftReceived);
    }
  }, [secondsLeftReceived]);

  const timerCountdown = isUndefined(secondsLeftReceived) ? undefined : (
    <Countdown
      value={Date.now() + Math.round(seconds || 0) * 1000}
      format="s"
      suffix="s"
      key={`service-status-counter-${countdownKey}`}
      onFinish={async () => {
        setCountdownKey(countdownKey + 1);

        if (typeof onTimerFinish === 'function') {
          onTimerFinish();
        }
      }}
      style={timerStyle}
    />
  );

  /**
   * show operations status (status, timer)
   * even if one of them is defined (hide if both are not defined)
   */
  const showOperationStatus = !isUndefined(isHealthy) || !isUndefined(secondsLeftReceived);

  const actualStatus = isHealthy ? (
    <>
      <span className="dot dot-online" />
      &nbsp;Operational
    </>
  ) : (
    <>
      <span className="dot dot-offline" />
      &nbsp;Disrupted
    </>
  );

  if (isMinimized)
    return (
      <MinimizedStatus
        isOperational={isHealthy}
        onMaximize={() => {
          setIsMinimized(false);
          if (onMinimizeToggle) onMinimizeToggle(false);
        }}
        timerCountdown={timerCountdown}
      />
    );

  return (
    <ContractsInfoContainer className="service-status-maximized" canMinimize={canMinimize}>
      <Badge canMinimize={canMinimize}>
        <a href="https://autonolas.network" target="_blank" rel="noreferrer">
          {canMinimize ? <PoweredByForSmallDevice /> : <PoweredBy />}
        </a>
      </Badge>

      {/* status (green/orange dot) & timers */}
      {canMinimize ? (
        <MobileOffChainContainer>
          <div>
            {!isUndefined(isHealthy) && <div>{actualStatus}</div>}
            <LinksSection appType={appType} isMidSize={true} />
          </div>
          <div className="extra-md-view">
            <div>{extraMd || null}</div>
          </div>
        </MobileOffChainContainer>
      ) : (
        <>
          {showOperationStatus && (
            <OffChainContainer>
              <Text className="status-sub-header">Off-chain Service Status</Text>
              <div className="status-sub-content">
                {!isUndefined(isHealthy) && <div>{actualStatus}</div>}

                {!isUndefined(secondsLeftReceived) && (
                  <>
                    <DotSpace />
                    <NextUpdateTimer>
                      Next update:&nbsp;
                      {isNil(seconds) ? <Dash /> : timerCountdown}
                    </NextUpdateTimer>
                  </>
                )}
              </div>
            </OffChainContainer>
          )}
          <ExtraContent>
            <LinksSection appType={appType} isMidSize={false} />
            {extra || null}
          </ExtraContent>
        </>
      )}

      <Button
        type="link"
        icon={<ShrinkOutlined />}
        size="small"
        className="minimize-btn"
        onClick={() => {
          setIsMinimized(true);
          if (onMinimizeToggle) onMinimizeToggle(true);
        }}
      >
        {canMinimize ? '' : 'Minimize'}
      </Button>
    </ContractsInfoContainer>
  );
};
