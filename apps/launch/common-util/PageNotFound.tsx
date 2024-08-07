import { Button, Result } from 'antd';
import { useRouter } from 'next/router';

import { URL } from 'common-util/constants/urls';

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
          type="primary"
          onClick={() => router.push(`/ethereum/${URL.myStakingContracts}`)}
        >
          My staking contracts
        </Button>
      }
    />
  );
};
