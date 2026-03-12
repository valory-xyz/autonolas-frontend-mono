import { Alert, Card, List, Skeleton } from 'antd';

import { EducationTitle } from 'components/Education/EducationTitle';
import { useAppSelector } from 'store/setup';

import { Proposal } from './Proposal';

const ProposalLoader = () => (
  <>
    <Card className="mb-12">
      <Skeleton active />
    </Card>

    <Card>
      <Skeleton active />
    </Card>
  </>
);

export const Proposals = () => {
  const { moduleDetails, isModuleDetailsLoading: isLoading } = useAppSelector(
    (state) => state.setup,
  );
  const proposals = moduleDetails?.scheduled_tweet?.tweets || [];
  const sortedProposals = [...proposals].sort((a, b) => b.createdDate - a.createdDate);

  return (
    <>
      <div className="mb-24">
        <EducationTitle title="Proposed posts" educationItem="proposals" />
      </div>

      {isLoading ? (
        <ProposalLoader />
      ) : (
        <>
          {proposals.length > 0 ? (
            <List>
              {sortedProposals.map((proposal) => (
                <Proposal key={proposal.request_id} proposal={proposal} />
              ))}
            </List>
          ) : (
            <Alert message="No proposals" showIcon type="info" />
          )}
        </>
      )}
    </>
  );
};
