// import { Paths } from 'components/Paths';
import styled from 'styled-components';
import { Table, Button } from 'antd';

const PathsContainer = styled.div`
  margin: auto 0;
`;
const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
`;

const data = [
  {
    "title": "Create Prediction Market for Sports Events",
    "address": "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Stock Market Trends",
    "address": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    "chain": "Gnosis Chain",
    "allocation": "7%"
  },
  {
    "title": "Create Prediction Market for Political Elections",
    "address": "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0",
    "chain": "Gnosis Chain",
    "allocation": "10%"
  },
  {
    "title": "Create Prediction Market for Cryptocurrency Prices",
    "address": "0xb0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
    "chain": "Gnosis Chain",
    "allocation": "8%"
  },
  {
    "title": "Create Prediction Market for Weather Forecasts",
    "address": "0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
    "chain": "Gnosis Chain",
    "allocation": "6%"
  },
  {
    "title": "Create Prediction Market for Entertainment Industry Events",
    "address": "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Technology Trends",
    "address": "0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Gaming Industry Events",
    "address": "0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Global Economic Indicators",
    "address": "0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Fashion Trends",
    "address": "0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Health Industry Developments",
    "address": "0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Environmental Events",
    "address": "0xd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Cultural Trends",
    "address": "0xe1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Space Exploration Events",
    "address": "0xf2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  },
  {
    "title": "Create Prediction Market for Food Industry Trends",
    "address": "0xa3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    "chain": "Gnosis Chain",
    "allocation": "5%"
  }
]

const columns = [
  {
    title: 'Name',
    dataIndex: 'title',
    key: 'name',
    render: (title, address) => {
      return (
        <Button type="link" >
          {title}
        </Button>
      );
    },
    width: 400,
  },
  {
    title: 'Chain',
    dataIndex: 'chain',
    key: 'chain',
    width: 250,
  },
  {
    title: 'Allocation',
    dataIndex: 'allocation',
    key: 'allocation',
    width: 150,
  },
];

export const AllPage = () => (
  <StyledMain>
    <PathsContainer>
      <h1>Staking Allocation </h1>
      <div style={{maxWidth: 800}}>
      <Table
          columns={columns}
          dataSource={data}
          pagination={false}
        />
      </div>
    </PathsContainer>
  </StyledMain>
);
