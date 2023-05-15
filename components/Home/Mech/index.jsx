import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { Table } from 'antd/lib';
import { AGENT_MECH_ABI } from 'common-util/AbiAndAddresses';
import Request from './components/Request';

// Replace the following values with your specific contract information
const CONTRACT_ADDRESS = '0xFf82123dFB52ab75C417195c5fDB87630145ae81';
const WEBSOCKET_PROVIDER = 'wss://rpc.gnosischain.com/wss';

const truncate = (str, length) => (str && str.length > length ? `${str.substring(0, length)}...` : str);

const cellStyle = {
  padding: '8px',
};

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
    // sender: truncate(event.returnValues.sender, 10),
    data: event.returnValues.data,
  }));

  const requestsDatasource = getDatasource(firstEvents);

  return (
    <div>
      <Request />
      <h2>Requests</h2>

      <Table
        columns={[
          {
            title: 'Index',
            dataIndex: 'index',
            key: 'index',
            render: (text) => <span>{text}</span>,
          },
          {
            title: 'Request Id',
            dataIndex: 'requestId',
            key: 'requestId',
            render: (text) => <span>{text}</span>,
          },
          {
            title: 'Sender',
            dataIndex: 'sender',
            key: 'sender',
            render: (text) => <span>{text}</span>,
          },
          {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            render: (text) => <span>{text}</span>,
          },
        ]}
        dataSource={requestsDatasource}
        pagination={false}
        // pagination={
        //   isPaginationRequired
        //     ? {
        //       total,
        //       current: currentPage,
        //       defaultPageSize: TOTAL_VIEW_COUNT,
        //       onChange: (e) => setCurrentPage(e),
        //     }
        //     : false
        // }
        scroll={{ x: 1200 }}
        rowKey={(x) => x.key}
      />
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Request Id</th>
            <th>Sender</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {firstEvents.map((event, index) => (
            <tr key={index}>
              <td style={cellStyle}>{index}</td>
              <td style={cellStyle}>{event.returnValues.requestId}</td>
              <td style={cellStyle}>
                {truncate(event.returnValues.sender, 10)}
              </td>
              <td style={cellStyle}>{event.returnValues.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Delivers</h2>
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Request Id</th>
            <th>Sender</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {secondEvents.map((event, index) => (
            <tr key={index}>
              <td style={cellStyle}>{index}</td>
              <td style={cellStyle}>{event.returnValues.requestId}</td>
              <td style={cellStyle}>
                {truncate(event.returnValues.sender, 10)}
              </td>
              <td style={cellStyle}>{event.returnValues.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventListener;
