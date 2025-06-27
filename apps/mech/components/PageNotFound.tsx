import { Button, Result } from 'antd';
import { useRouter } from 'next/router';

import { FIRST_SUPPORTED_CHAIN } from 'common-util/Login/config';
import { URL } from 'util/constants';

export const PageNotFound = () => {
  const router = useRouter();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button
          size="large"
          type="link"
          onClick={() => router.push(`/${FIRST_SUPPORTED_CHAIN.networkName}/${URL.MECHS}`)}
        >
          Check out Mechs on {FIRST_SUPPORTED_CHAIN.networkDisplayName}
        </Button>
      }
    />
  );
};
