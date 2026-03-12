import { Meta } from 'components/Meta';
import { PathDetailPage } from 'components/PathDetail';

const PathDetail = () => (
  <>
    <Meta
      pageTitle="Path Details"
      description="View detailed information about a specific launcher path. Learn the steps and requirements for deploying AI agent economies with this approach."
      pageUrl="paths"
    />
    <PathDetailPage />
  </>
);

export default PathDetail;
