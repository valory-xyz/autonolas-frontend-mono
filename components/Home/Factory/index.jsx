import { Typography } from 'antd/lib';
// import { BuolasCreateLock } from './components/AddToLock';
import { BuolasManage } from './components/BuolasManage';

const { Title, Paragraph } = Typography;

export const Factory = () => (
  <div>
    <Title>buOLAS</Title>
    <Paragraph style={{ maxWidth: 550 }}>
      buOLAS is a vesting contract that allows locking and linear release of
      OLAS tokens.&nbsp;
    </Paragraph>

    {/* BuOlas create won't be visible to the user & used interally */}
    {/* <BuolasCreateLock /> */}
    <BuolasManage />
  </div>
);
