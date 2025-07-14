import { Typography } from 'antd';

import educationItems from 'common-util/Education/data.json';

import { DOCS_SECTIONS } from '../helpers';

const { Title, Paragraph, Text } = Typography;

export const Overview = () => {
  const filteredEducationItems = educationItems.filter((item) => item.hidden !== true);

  return (
    <div id={DOCS_SECTIONS.overview}>
      <Title level={2}>Overview</Title>
      <Paragraph>
        Olas Contribute is a system for coordinating work in Olas DAO. It is made up of several main
        components:
      </Paragraph>

      <Paragraph>
        <ul>
          {filteredEducationItems.map((item) => (
            <li key={item.id}>
              <Text strong style={{ textTransform: 'capitalize' }}>
                {item.component}
              </Text>
              &nbsp;–&nbsp;
              {item.text}
            </li>
          ))}
        </ul>
      </Paragraph>

      <Paragraph>
        Olas Contribute is powered by an autonomous service. This means it is able to automate
        complex operations in a fully decentralized way, for example:
        <ul>
          <li>processing actions</li>
          <li>aggregating points</li>
          <li>updating NFT metadata</li>
          <li>automated evaluation of action using AI</li>
        </ul>
      </Paragraph>

      <br />
      <br />
      <br />
    </div>
  );
};
