import { Typography } from 'antd';
import Image from 'next/image';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph, Text } = Typography;

export const HowItWorks = () => (
  <div id={DOCS_SECTIONS['how-it-works']}>
    <Title level={2}>How it works</Title>

    <Paragraph>
      Curious to understand how the leaderboard, actions and badges work technically? Olas
      Contribute leaderboard is an autonomous service that manages the updating of Olas community
      non-fungible tokens (NFTs).&nbsp;
      <a href="https://www.autonolas.network/education-articles/2" target="_blank" rel="noreferrer">
        Autonomous services
      </a>
      &nbsp;are made up of multiple agents who come to consensus on what action to take. This means
      that autonomous services are not only decentralized, they have inbuilt fault tolerance.
    </Paragraph>

    <Paragraph>
      The service pulls in data from a Google spreadsheet that contains every address that has
      minted a token and their assigned score. It uses a system of image codes to generate and
      modify IPFS image metadata based on the user&apos;s score. It redirects URIs towards the
      updated metadata so that the NFTs display a new image when visualized on NFT platforms such as
      Opensea.
    </Paragraph>

    {/* <img
      src="/images/autonomous-service.jpg"
      alt="Autonomous Service"
      style={{ width: '100%', height: '100%', marginBottom: '2rem' }}
    /> */}
    <Image
      src="/images/autonomous-service.jpg"
      alt="Autonomous Service"
      width={583}
      height={291}
      style={{ width: '100%', height: '100%', marginBottom: '2rem' }}
    />

    <Paragraph>
      Going into more technical detail. The service is built using a finite state machine (FSM)
      architecture, enabling maximum composability. The FSM composed of several rounds, namely:
    </Paragraph>

    <Paragraph>
      <ul>
        <li>
          <Text strong>NewMemberListRound</Text>
          &nbsp;– agents search for new minted NFTs and create a list of wallets holding a community
          NFT that is not in the first table. This list is then used to update the table.
        </li>
        <li>
          <Text strong>LeaderboardObservationRound</Text>
          &nbsp;– agents read the leaderboard from the API and agree on the JSON file they receive.
        </li>
        <li>
          <Text strong>ImageCodeCalculationRound</Text>
          &nbsp;– for each entry in the leaderboard, agents check for members whose number of points
          have changed and recalculate their images.
        </li>
        <li>
          <Text strong>ImageGenerationRound</Text>
          &nbsp;– agents check for new image codes and generate the corresponding images.
        </li>
        <li>
          <Text strong>ImageStorageRound</Text>
          &nbsp;– agents store the generated images on IPFS and update the redirect table.
        </li>
        <li>
          <Text strong>UpdateDatabaseRound</Text>
          &nbsp;– agents update the first table with the new image codes and points.
        </li>
      </ul>
    </Paragraph>

    <Paragraph>
      This process is repeated periodically to ensure that the community NFTs are up-to-date and
      reflect the latest scores of their owners.
    </Paragraph>

    <br />
    <br />
    <br />
  </div>
);
