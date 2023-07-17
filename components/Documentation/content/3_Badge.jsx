import Link from 'next/link';
import { Typography } from 'antd/lib';
import Image from 'next/image';
import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph, Text } = Typography;

const Badge = () => (
  <div id={DOCS_SECTIONS.badge}>
    <Title level={2}>Badge</Title>
    <Paragraph>
      Community members can mint an Contribute Badge. Badges are a fun visual
      representation of community contributions. Badges are NFTs following the
      ERC-721 standard. They update when community members earn points. This
      happens automatically at regular intervals. The updates are done by a
      decentralized, off-chain service powered by Autonolas.
    </Paragraph>
    <Paragraph>
      If actions change, you do not lose points and your badge does not
      downgrade.
    </Paragraph>
    <Title level={5}>Mint your badge</Title>
    <Paragraph>
      <ol>
        <li>
          Go to the&nbsp;
          <Link href="/">homepage</Link>
          .
        </li>
        <li>
          Connect a Web3 wallet. The website supports MetaMask and
          WalletConnect-enabled wallets.
        </li>
        <li>Under “Badge”, click “Mint Badge”.</li>
        <li>
          Follow the instructions in your wallet to submit the minting
          transaction. Badges are NFTs on mainnet Ethereum. There is no fee to
          mint a badge, but the minting transaction requires that you pay ETH to
          fund the cost of gas.
        </li>
        <li>Wait for the transaction to complete.</li>
        <li>If necessary, refresh the page. </li>
        <li>You should now see your badge on the website.</li>
      </ol>
    </Paragraph>
    <Title level={5}>Progression and tiers</Title>
    <Image
      priority
      src="/images/badge-evolution.png"
      alt="Mint NFT"
      width={444}
      height={208}
      className="mint-nft-image"
    />
    <Paragraph>There are several badge tiers, and each has a different shape:</Paragraph>
    <Paragraph>
      <ol>
        <li>
          <Text strong>Idle</Text>
          &nbsp;–  0 - 100 points. Badge is not activated. Register your profile
          to activate.
        </li>
        <li>
          <Text strong>Basic</Text>
          &nbsp;– 0 – 50k points
        </li>
        <li>
          <Text strong>Legendary</Text>
          &nbsp;– 50k – 100k points
        </li>
        <li>
          <Text strong>Epic</Text>
          &nbsp;– 100k - 150k points
        </li>
      </ol>
    </Paragraph>
    <Paragraph>What comes after Epic? Get there first and find out!</Paragraph>
    <br />
    <br />
    <br />
  </div>
);

export default Badge;
