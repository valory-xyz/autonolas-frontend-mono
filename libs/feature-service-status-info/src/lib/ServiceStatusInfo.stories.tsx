import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { Typography, Divider } from 'antd';
import { notifySuccess } from '@autonolas-frontend-mono/util-functions';

import { AppType } from './types';
import { ServiceStatusInfo } from './ServiceStatusInfo';

export default {
  title: 'Service Status Info',
};

const { Text } = Typography;

const DummyContianer = styled.div`
  font-family: system-ui;
  a {
    text-decoration: underline;
    text-underline-offset: 4px;
    line-height: 1.5715;
  }
  .row-1 {
    font-size: 14px;
  }
  .service-status-maximized {
    /* just for storybook, else it will be always be sticky in footer */
    position: relative !important;
    bottom: 0;
    left: 0;
  }
  .ant-divider-horizontal {
    padding-top: 1rem;
  }
`;

const Extra = () => (
  <div>
    <Text className="row-1">SOME TITLE</Text>
    <div className="status-sub-content">Some text</div>
  </div>
);

const ExtraMd = () => <div> Some text on md </div>;

export const Default = () => {
  const [dummySeconds, setDummySeconds] = useState(5);

  const list: Array<{ name: string; type: AppType; hideSeconds?: boolean }> = [
    { name: 'Oracle Kit', type: 'oraclekit' },
    { name: 'ML kit', type: 'mlkit' },
    { name: 'Mint Kit', type: 'mintkit' },
    { name: 'Contribution Kit', type: 'coordinationkit' },
    { name: 'IEKit', type: 'iekit', hideSeconds: true },
    { name: 'GovKit', type: 'govkit', hideSeconds: true },
    { name: 'MechKit', type: 'mechkit', hideSeconds: true },
    { name: 'KeeperKit', type: 'keeperkit', hideSeconds: true },
    { name: 'MessagingKit', type: 'messagingkit', hideSeconds: true },
  ];

  return (
    <DummyContianer>
      {list.map((e) => {
        const otherProps = !e.hideSeconds
          ? { isHealthy: true, secondsLeftReceived: 15 }
          : {};
        return (
          <Fragment key={e.type}>
            <Divider orientation="left">{e.name}</Divider>
            <ServiceStatusInfo
              {...otherProps}
              isDefaultMaximized
              appType={e.type}
              onMinimizeToggle={(isMinimized) => console.log({ isMinimized })}
            />
          </Fragment>
        );
      })}

      <Divider orientation="left">With appType & more text</Divider>
      <ServiceStatusInfo
        isHealthy={true}
        appType={'mintkit'}
        extra={<Extra />}
        extraMd={<ExtraMd />}
        onMinimizeToggle={(isMinimized) => console.log({ isMinimized })}
      />

      <Divider orientation="left">Generic without appType</Divider>
      <ServiceStatusInfo
        isHealthy={true}
        isDefaultMaximized
        secondsLeftReceived={dummySeconds}
        onTimerFinish={() => {
          notifySuccess('Timer completed!');
          setDummySeconds(15);
        }}
        extra={<Extra />}
        extraMd={<ExtraMd />}
        onMinimizeToggle={(isMinimized) => console.log({ isMinimized })}
      />

      <Divider orientation="left">Generic without timer & appType</Divider>
      <ServiceStatusInfo extra={<Extra />} extraMd={<ExtraMd />} />
    </DummyContianer>
  );
};
