import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Table, Typography } from 'antd/lib';
import { useRouter } from 'next/router';
import { DEFAULT_MECH_CONTRACT_ADDRESS } from 'util/constants';
import { AGENT_MECH_ABI } from 'common-util/AbiAndAddresses';
import { EllipsisMiddle } from 'common-util/List/ListTable/helpers';
import { NA } from 'common-util/constants';
import { notifyError, notifySuccess } from 'common-util/functions';
import Request from './components/Request';

// Replace the following values with your specific contract information
const WEBSOCKET_PROVIDER = 'wss://rpc.gnosischain.com/wss';

const { Title } = Typography;

const filterOption = { fromBlock: 28127133, toBlock: 'latest' };

const onNewEvent = (event) => {
  notifySuccess(
    'New event recevied',
    <a
      href={`https://gnosisscan.io/tx/${event?.transactionHash}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Tx
    </a>,
  );
};

const onErrorEvent = (error, type) => {
  notifyError('Error occurred while receiving event, please check console');
  console.error(`Error occurred on ${type} event`, error);
};

const EventListener = () => {
  const [web3Ws, setWeb3Ws] = useState(null);
  const [contractWs, setContractWs] = useState(null);
  const [firstEvents, setFirstEvents] = useState([]);
  const [isFirstEventLoading, setIsFirstEventLoading] = useState(false);

  const [secondEvents, setSecondEvents] = useState([]);
  const [isSecondEventLoading, setIsSecondEventLoading] = useState(false);

  // get the id from the next js router
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const web3Instance = new Web3(
      new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER),
    );
    setWeb3Ws(web3Instance);
  }, []);

  const sortEvents = (e) => e.sort((a, b) => b.blockNumber - a.blockNumber);

  useEffect(() => {
    if (web3Ws) {
      const contractInstance = new web3Ws.eth.Contract(
        AGENT_MECH_ABI,
        id || DEFAULT_MECH_CONTRACT_ADDRESS,
      );
      setContractWs(contractInstance);
    }
  }, [web3Ws]);

  // Effect hook for listening to the FirstEvent
  useEffect(() => {
    let eventListener;
    const getFirstEvents = async () => {
      setIsFirstEventLoading(true);

      try {
        // Get past FirstEvent events
        const pastFirstEvents = await contractWs.getPastEvents(
          'Request',
          filterOption,
        );

        setIsFirstEventLoading(false);
        setFirstEvents(sortEvents(pastFirstEvents));
      } catch (error) {
        console.error('Error on getting past events for `Request`', error);
      }

      // "Events": Listen to new FirstEvent events
      eventListener = contractWs.events.Request({}, (error, event) => {
        if (error) {
          onErrorEvent(error, 'Request');
        } else {
          onNewEvent(event);
          setFirstEvents((prevEvents) => sortEvents([...prevEvents, event]));
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
    let eventListener;
    const getSecondEvents = async () => {
      setIsSecondEventLoading(true);

      try {
        // Get past SecondEvent events
        const pastSecondEvents = await contractWs.getPastEvents(
          'Deliver',
          filterOption,
        );

        setIsSecondEventLoading(false);
        setSecondEvents(sortEvents(pastSecondEvents));
      } catch (error) {
        console.error('Error on getting past events for `Deliver`', error);
      }

      // "Events": Listen to new SecondEvent events
      eventListener = contractWs.events.Deliver({}, (error, event) => {
        if (error) {
          onErrorEvent(error, 'Deliver');
        } else {
          onNewEvent(event);
          setSecondEvents((prevEvents) => sortEvents([...prevEvents, event]));
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

  const getDataSource = (eventsPassed) => eventsPassed.map((event, index) => ({
    key: `row-request-${index}`,
    index: index + 1,
    requestId: event.returnValues.requestId,
    sender: event.returnValues.sender,
    data: event.returnValues.data,
  }));

  const requestsDatasource = getDataSource(firstEvents);
  const deliversDatasource = getDataSource(secondEvents);

  return (
    <div>
      <Request />
      <Title level={3}>Requests</Title>
      <Table
        loading={isFirstEventLoading}
        dataSource={requestsDatasource}
        pagination={false}
        rowKey={(x) => x.key}
        columns={[
          {
            title: 'Request Id',
            dataIndex: 'requestId',
            key: 'requestId',
            width: 420,
            render: (text) => (
              <EllipsisMiddle suffixCount={12}>{text}</EllipsisMiddle>
            ),
          },
          {
            title: 'Sender',
            dataIndex: 'sender',
            key: 'sender',
            width: 420,
            render: (text) => {
              if (!text) return NA;
              return <EllipsisMiddle suffixCount={12}>{text}</EllipsisMiddle>;
            },
          },
          {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            width: 420,
            render: (text) => {
              if (!text) return NA;
              return (
                <EllipsisMiddle suffixCount={12} isIpfsLink>
                  {text}
                </EllipsisMiddle>
              );
            },
          },
        ]}
      />

      <br />
      <Title level={3}>Delivers</Title>
      <Table
        loading={isSecondEventLoading}
        dataSource={deliversDatasource}
        pagination={false}
        rowKey={(x) => x.key}
        columns={[
          {
            title: 'Request Id',
            dataIndex: 'requestId',
            key: 'requestId',
            render: (text) => (
              <EllipsisMiddle suffixCount={12}>{text}</EllipsisMiddle>
            ),
          },
          {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            render: (text) => (
              <EllipsisMiddle suffixCount={12} isIpfsLink>
                {text}
              </EllipsisMiddle>
            ),
          },
        ]}
      />
    </div>
  );
};

export default EventListener;
