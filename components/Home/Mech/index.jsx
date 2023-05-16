import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Table, Typography } from 'antd/lib';
import { AGENT_MECH_ABI } from 'common-util/AbiAndAddresses';
import { EllipsisMiddle } from 'common-util/List/ListTable/helpers';
import { NA } from 'common-util/constants';
import Request from './components/Request';

// Replace the following values with your specific contract information
const CONTRACT_ADDRESS = '0xFf82123dFB52ab75C417195c5fDB87630145ae81';
const WEBSOCKET_PROVIDER = 'wss://rpc.gnosischain.com/wss';

const { Title } = Typography;

const EventListener = () => {
  const [web3Ws, setWeb3Ws] = useState(null);
  const [contractWs, setContractWs] = useState(null);
  const [firstEvents, setFirstEvents] = useState([]);
  const [secondEvents, setSecondEvents] = useState([]);

  useEffect(() => {
    const web3Instance = new Web3(
      new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER),
    );
    setWeb3Ws(web3Instance);
  }, []);

  useEffect(() => {
    if (web3Ws) {
      const contractInstance = new web3Ws.eth.Contract(
        AGENT_MECH_ABI,
        CONTRACT_ADDRESS,
      );
      setContractWs(contractInstance);
    }
  }, [web3Ws]);

  // Effect hook for listening to the FirstEvent
  useEffect(() => {
    const getFirstEvents = async () => {
      // Listen to new FirstEvent events
      contractWs.events.Request({}, (error, event) => {
        if (error) {
          console.error(error);
        } else {
          setFirstEvents((prevEvents) => [...prevEvents, event]);
        }
      });

      // Get past FirstEvent events
      const pastFirstEvents = await contractWs.getPastEvents('Request', {
        fromBlock: 27912345,
        toBlock: 'latest',
      });

      setFirstEvents(pastFirstEvents);
    };

    if (contractWs) {
      getFirstEvents();
    }
  }, [contractWs]);

  // Effect hook for listening to the SecondEvent
  useEffect(() => {
    const getSecondEvents = async () => {
      // Listen to new SecondEvent events
      contractWs.events.Deliver({}, (error, event) => {
        if (error) {
          console.error(error);
        } else {
          setSecondEvents((prevEvents) => [...prevEvents, event]);
        }
      });

      // Get past SecondEvent events
      const pastSecondEvents = await contractWs.getPastEvents('Deliver', {
        fromBlock: 27912345,
        toBlock: 'latest',
      });

      setSecondEvents(pastSecondEvents);
    };

    if (contractWs) {
      getSecondEvents();
    }
  }, [contractWs]);

  const getDatasource = (eventsPassed) => eventsPassed.map((event, index) => ({
    key: `row-request-${index}`,
    index: index + 1,
    requestId: event.returnValues.requestId,
    sender: event.returnValues.sender,
    data: event.returnValues.data,
  }));

  const requestsDatasource = getDatasource(firstEvents);
  const deliversDatasource = getDatasource(secondEvents);

  return (
    <div>
      <Request />
      <Title level={3}>Requests</Title>
      <Table
        columns={[
          {
            title: 'Index',
            dataIndex: 'index',
            key: 'index',
          },
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
            render: (text) => (
              <EllipsisMiddle suffixCount={12} isIpfsLink>
                {text}
              </EllipsisMiddle>
            ),
          },
        ]}
        dataSource={requestsDatasource}
        pagination={false}
        rowKey={(x) => x.key}
      />

      <Title level={3}>Delivers</Title>
      <Table
        columns={[
          {
            title: 'Index',
            dataIndex: 'index',
            key: 'index',
          },
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
        dataSource={deliversDatasource}
        pagination={false}
        rowKey={(x) => x.key}
      />
    </div>
  );
};

export default EventListener;
