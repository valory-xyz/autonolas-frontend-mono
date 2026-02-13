import dynamic from 'next/dynamic';

import { Meta } from '../../../components/Meta';

const ListAgents = dynamic(() => import('../../../components/ListAgents'), {
  ssr: false,
});

const AgentBlueprints = ({ network }) => {
  return (
    <>
      <Meta
        pageTitle="Agent Blueprints"
        description="Browse agent blueprints in the Olas registry. Discover templates and designs for building autonomous AI agents."
        pageUrl={`${network || ''}/agent-blueprints`}
      />
      <ListAgents />
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { network } = context.params;

  return {
    props: {
      network,
    },
  };
};

export default AgentBlueprints;
