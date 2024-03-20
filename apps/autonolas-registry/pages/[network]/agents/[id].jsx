import dynamic from 'next/dynamic';

const AgentDetails = dynamic(() => import('../../../components/ListAgents/details'), {
  ssr: false,
});

const Agent = () => {
  console.log('AgentDetails pages/network/agents/id.jsx');
  return <AgentDetails />;
}

export default Agent;
// export default AgentDetails;
