import { Result } from 'antd';

export const PageDoesNotExist = () => (
  <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />
);
