import { Button, Result } from 'antd';
import Link from 'next/link';

import { Meta } from 'components/Meta';

const NotFound = () => (
  <>
    <Meta pageTitle="Page not found" description="The page you are looking for does not exist." />
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Link href="/contracts" passHref>
          <Button type="primary">Back to contracts</Button>
        </Link>
      }
    />
  </>
);

export default NotFound;
