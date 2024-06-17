import { Flex } from 'antd';
import { useRouter } from 'next/router';

export const EachStakingContract = () => {
  const router = useRouter();
  const id = router.query.id;

  return (
    <div>
      <Flex gap={24}>Hello Each Staking Contract, {id}!</Flex>
    </div>
  );
};
