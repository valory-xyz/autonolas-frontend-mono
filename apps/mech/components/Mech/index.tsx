import { Alert, ConfigProvider, Empty, Skeleton, Table, Typography } from 'antd';
import { uniqBy } from 'lodash';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import type { Contract, EventData } from 'web3-eth-contract';

import { AddressLink, NA, notifyError, notifySuccess } from '@autonolas/frontend-library';

import { AGENT_MECH_ABI, OLAS_MECH_ABI } from 'common-util/AbiAndAddresses';
import { SUPPORTED_CHAINS } from 'common-util/login/config';
import { getChainId } from 'common-util/functions';
import { SCAN_URLS, WEBSOCKET_URLS } from 'util/constants';
import { HeaderTitle } from 'components/Title';
import { Request } from 'components/Request/Request';

// Replace the following values with your specific contract information
const LATEST_BLOCK_COUNT = 5000;

const { Title } = Typography;

type Event = EventData;

type EventSubscription = {
  unsubscribe: () => void;
};

type TableDataSource = {
  key: string;
  index: number;
  requestId: string;
  sender: string;
  requestData?: string;
  deliverData?: string;
};

const onNewEvent = (event: Event) => {
  notifySuccess(
    'Event received',
    <a
      href={`${SCAN_URLS[getChainId()]}/tx/${event?.transactionHash}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Tx
    </a>,
    event?.returnValues?.requestId,
  );
};

const onErrorEvent = (error: Error, type: string) => {
  notifyError('Error occurred while receiving event, please check console');
  console.error(`Error occurred on ${type} event`, error);
};

const EventListener = () => {
  const [web3Ws, setWeb3Ws] = useState<Web3 | null>(null);
  const [contractWs, setContractWs] = useState<Contract | null>(null);

  const [firstEvents, setFirstEvents] = useState<Event[]>([]);
  const [isFirstEventLoading, setIsFirstEventLoading] = useState(false);
  const [isFirstEventError, setIsFirstEventError] = useState(false);

  const [secondEvents, setSecondEvents] = useState<Event[]>([]);
  const [isSecondEventLoading, setIsSecondEventLoading] = useState(false);
  const [isSecondEventError, setIsSecondEventError] = useState(false);

  const { query } = useRouter();
  const id = query?.id as string;
  const isLegacy = Boolean(query.legacy);

  useEffect(() => {
    const chainId = getChainId();
    const websocketProvider = WEBSOCKET_URLS[chainId];
    if (!websocketProvider) {
      throw new Error('Websocket URL for selected chainId is not provided');
    }

    const web3Instance = new Web3(new Web3.providers.WebsocketProvider(websocketProvider));
    setWeb3Ws(web3Instance);
  }, []);

  /**
   *
   * @param {Array} e
   */
  const sortAndRemoveDuplicateEvents = (e: Event[]) => {
    const uniqueEvents = uniqBy(e, (event) => event.returnValues.requestId);
    return uniqueEvents.sort((a, b) => b.blockNumber - a.blockNumber);
  };

  const getFilterOption = async () => {
    const blockNumber = await web3Ws?.eth.getBlockNumber();

    /**
     * blockNumber - 5000 is used to get the past 5000 blocks
     * due to too many events, we can't get all the events at once
     * // TODO: add pagination
     */
    const filterOption = {
      fromBlock: blockNumber! - LATEST_BLOCK_COUNT,
      toBlock: 'latest',
    };
    return filterOption;
  };

  useEffect(() => {
    if (web3Ws && id) {
      const abi = isLegacy ? AGENT_MECH_ABI : OLAS_MECH_ABI;
      // @ts-expect-error ABI type not correctly identified
      const contractInstance = new web3Ws.eth.Contract(abi, id);
      setContractWs(contractInstance);
    }
  }, [isLegacy, web3Ws, id]);

  // Effect hook for listening to the FirstEvent
  useEffect(() => {
    let eventListener: EventSubscription | null = null;
    const getFirstEvents = async () => {
      setIsFirstEventLoading(true);

      try {
        const filterOption = await getFilterOption();

        // Get past FirstEvent events
        const pastFirstEvents = await contractWs?.getPastEvents('Request', filterOption);

        setFirstEvents(sortAndRemoveDuplicateEvents(pastFirstEvents || []));
      } catch (error) {
        setIsFirstEventError(true);
        console.error('Error on getting past events for `Request`', error);
      } finally {
        setIsFirstEventLoading(false);
      }

      // "Events": Listen to new FirstEvent events
      eventListener = contractWs?.events.Request({}, (error: Error, event: Event) => {
        if (error) {
          onErrorEvent(error, 'Request');
        } else {
          onNewEvent(event);
          setFirstEvents((prevEvents) => sortAndRemoveDuplicateEvents([...prevEvents, event]));
        }
      });
    };

    if (contractWs) {
      getFirstEvents();
    }

    return () => {
      if (eventListener && typeof eventListener.unsubscribe === 'function') {
        eventListener.unsubscribe();
      }
    };
  }, [contractWs]);

  // Effect hook for listening to the SecondEvent
  useEffect(() => {
    let eventListener: EventSubscription | null = null;
    const getSecondEvents = async () => {
      setIsSecondEventLoading(true);

      try {
        const filterOption = await getFilterOption();

        // Get past SecondEvent events
        const pastSecondEvents = await contractWs?.getPastEvents('Deliver', filterOption);

        setSecondEvents(sortAndRemoveDuplicateEvents(pastSecondEvents || []));
      } catch (error) {
        setIsSecondEventError(true);
        console.error('Error on getting past events for `Deliver`', error);
      } finally {
        setIsSecondEventLoading(false);
      }

      // "Events": Listen to new SecondEvent events
      eventListener = contractWs?.events.Deliver({}, (error: Error, event: Event) => {
        if (error) {
          onErrorEvent(error, 'Deliver');
        } else {
          onNewEvent(event);
          setSecondEvents((prevEvents) => sortAndRemoveDuplicateEvents([...prevEvents, event]));
        }
      });
    };

    if (contractWs) {
      getSecondEvents();
    }

    return () => {
      if (eventListener && typeof eventListener.unsubscribe === 'function') {
        eventListener.unsubscribe();
      }
    };
  }, [contractWs]);

  const getRequestAndDeliversData = useCallback((): TableDataSource[] => {
    const requestsDatasource = firstEvents.map((event, index) => ({
      key: `row-request-${index}`,
      index: index + 1,
      requestId: event.returnValues.requestId,
      sender: event.returnValues.sender,
      requestData: event.returnValues.data,
    }));

    const deliversDatasource = secondEvents.map((event, index) => ({
      key: `row-delivers-${index}`,
      index: index + 1,
      requestId: event.returnValues.requestId,
      sender: event.returnValues.sender,
      deliverData: event.returnValues.data,
    }));

    if (deliversDatasource.length === 0) return requestsDatasource;
    if (requestsDatasource.length === 0) return deliversDatasource;

    const finalDataSource = requestsDatasource.map((request) => {
      const deliver = deliversDatasource.find((d) => d.requestId === request.requestId);

      if (deliver) {
        return { ...request, deliverData: deliver.deliverData };
      }

      return request;
    });

    return finalDataSource;
  }, [firstEvents, secondEvents]);

  const isLoading = isFirstEventLoading || isSecondEventLoading;
  const hasErrors = isFirstEventError || isSecondEventError;

  return (
    <div>
      <ConfigProvider
        renderEmpty={() => {
          if (hasErrors) {
            return <Empty description="Error occurred while fetching events" />;
          }

          if (isLoading) {
            return <Empty description="Loading events..." />;
          }

          return (
            <Empty
              description={
                <>
                  <p>{`No events found. Only loading latest ${LATEST_BLOCK_COUNT} block(s).`}</p>
                  <a
                    href={`${SCAN_URLS[getChainId()]}/address/${id}#events`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    See earlier events
                  </a>
                  .
                </>
              }
            />
          );
        }}
      >
        <HeaderTitle title="Request" description="Make agent requests" />
        <Request mechAddress={id} isLegacy={isLegacy} />
        <Alert
          message={`We only load the latest ${LATEST_BLOCK_COUNT} blocks due to data availability issues.`}
          showIcon
          className="mt-12"
        />
        <Title level={3}>Requests</Title>
        <Table
          loading={isFirstEventLoading}
          dataSource={getRequestAndDeliversData()}
          rowKey={(x) => x.key}
          columns={[
            {
              title: 'Request Id',
              dataIndex: 'requestId',
              key: 'requestId',
              width: 260,
              render: (text: string) => (
                <AddressLink text={text} textMinWidth={195} suffixCount={8} canCopy cannotClick />
              ),
            },
            ...(isLegacy
              ? [
                  {
                    title: 'Sender',
                    dataIndex: 'sender',
                    key: 'sender',
                    width: 300,
                    render: (text: string) => {
                      if (!text) return NA;
                      return (
                        <AddressLink
                          text={text}
                          textMinWidth={245}
                          suffixCount={10}
                          canCopy
                          supportedChains={SUPPORTED_CHAINS}
                        />
                      );
                    },
                  },
                ]
              : []),
            {
              title: 'Request Data',
              dataIndex: 'requestData',
              key: 'requestData',
              width: 300,
              render: (text: string) => {
                if (!text) return NA;
                return (
                  <AddressLink text={text} textMinWidth={240} suffixCount={10} canCopy isIpfsLink />
                );
              },
            },
            {
              title: 'Delivers Data',
              dataIndex: 'deliverData',
              key: 'deliverData',
              width: 300,
              render: (text: string) => {
                if (isSecondEventLoading) {
                  return <Skeleton.Input active />;
                }

                if (!text) return NA;

                return (
                  <AddressLink text={text} textMinWidth={240} suffixCount={10} canCopy isIpfsLink />
                );
              },
            },
          ]}
        />
      </ConfigProvider>
    </div>
  );
};

export default EventListener;
