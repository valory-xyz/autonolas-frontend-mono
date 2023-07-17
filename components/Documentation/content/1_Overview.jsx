import { Typography } from 'antd/lib';
import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph } = Typography;

const Overview = () => (
  <>
    <div id={DOCS_SECTIONS.overview}>
      <Title level={2}>Off-chain Agent (AI Worker)</Title>
      <Paragraph>
        Any autonomous agent or bot that runs off-chain, executes AI tasks and
        holds a wallet for signing transactions.
      </Paragraph>

      <br />
      <br />
    </div>
  </>
);

export default Overview;
