import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { AGENT_MECH_ABI } from 'common-util/AbiAndAddresses';
import Request from './components/Request';

// Replace the following values with your specific contract information
const CONTRACT_ADDRESS = '0x3504fb5053ec12f748017248a395b4ed31739705';
const WEBSOCKET_PROVIDER = 'wss://rpc.gnosischain.com/wss';

const truncate = (str, length) => (
  str && str.length > length ? `${str.substring(0, length)}...` : str
);

const cellStyle = {
  padding: '8px',
};

const EventListener = () => {
  const [web3Ws, setWeb3Ws] = useState(null);
  const [contractWs, setContractWs] = useState(null);
  const [firstEvents, setFirstEvents] = useState([]);
  const [secondEvents, setSecondEvents] = useState([]);

  useEffect(() => {
    const web3Instance = new Web3(new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER));
    setWeb3Ws(web3Instance);
  }, []);

  useEffect(() => {
    if (web3Ws) {
      const contractInstance = new web3Ws.eth.Contract(AGENT_MECH_ABI, CONTRACT_ADDRESS);
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

  return (
    <div>
      <Request />
      <h2>Requests</h2>
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
              <td style={cellStyle}>{truncate(event.returnValues.sender, 10)}</td>
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
              <td style={cellStyle}>{truncate(event.returnValues.sender, 10)}</td>
              <td style={cellStyle}>{event.returnValues.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventListener;
