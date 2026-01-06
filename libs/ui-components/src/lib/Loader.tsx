import React, { useState, useEffect, ReactNode } from 'react';
import { Button, Skeleton } from 'antd';
import styled from 'styled-components';
import { isNil } from 'lodash';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 200px;
  .timeout-message {
    margin-bottom: 8px;
  }
`;

// wait for 20 seconds before showing the error message
const TIMEOUT_IN_SECONDS = 20;

const DEFAULT_MESSAGE = 'Items couldn’t be loaded';

type LoaderProps = {
  account?: string | null;
  timeoutSeconds?: number;
  isAccountRequired?: boolean;
  notConnectedMessage?: ReactNode;
  timeoutMessage?: ReactNode;
};

export const Loader = ({
  account,
  timeoutSeconds,
  isAccountRequired,
  notConnectedMessage,
  timeoutMessage,
}: LoaderProps) => {
  const [seconds, setSeconds] = useState(timeoutSeconds || TIMEOUT_IN_SECONDS);

  useEffect(() => {
    setSeconds(isNil(timeoutSeconds) ? TIMEOUT_IN_SECONDS : timeoutSeconds);
  }, [timeoutSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [seconds]);

  return (
    <>
      {isAccountRequired && !account ? (
        <Container>
          <p>{notConnectedMessage || 'Please connect your wallet'}</p>
        </Container>
      ) : (
        <>
          {seconds === 0 ? (
            <Container>
              <div className="timeout-message">{timeoutMessage || DEFAULT_MESSAGE}</div>
              <Button ghost type="primary" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </Container>
          ) : (
            <Skeleton active />
          )}
        </>
      )}
    </>
  );
};
