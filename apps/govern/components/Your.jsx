import { ArrowsAltOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row, Slider, Table } from 'antd';
import { useState } from 'react';

import styled from 'styled-components';

const PathsContainer = styled.div`
  margin: auto 0;
`;
const StyledMain = styled.main`
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
`;

const initialData = [
  {
    title: 'Create Prediction Market for Global Economic Indicators',
    address: '0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
    chain: 'Gnosis Chain',
    allocation: '38%',
  },
  {
    title: 'Create Prediction Market for Fashion Trends',
    address: '0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
    chain: 'Gnosis Chain',
    allocation: '12%',
  },
  {
    title: 'Create Prediction Market for Food Industry Trends',
    address: '0xa3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    chain: 'Gnosis Chain',
    allocation: '5%',
  },
];

const columns = [
  {
    title: 'Name',
    dataIndex: 'title',
    key: 'name',
    render: (title, address) => {
      return <Button type="link">{title}</Button>;
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

const columnsUpdating = (allocations, setAllocations) => [
  {
    title: 'Name',
    dataIndex: 'title',
    key: 'name',
    render: (title, address) => {
      return <Button icon={<ArrowsAltOutlined style={{ paddingLeft: 12 }} />}>{title}</Button>;
    },
    width: 400,
  },
  {
    title: 'Chain',
    dataIndex: 'chain',
    key: 'chain',
    width: 150,
  },
  {
    title: 'Allocation',
    dataIndex: 'allocation',
    key: 'allocation',
    render: (_, record, index) => {
      console.log('allocations[row]', allocations[index], allocations, index);
      return (
        <Row>
          <Col span={12}>
            <Slider
              min={0}
              max={100}
              onChange={(value) => {
                setAllocations(value, index);
              }}
              value={allocations[index]}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              min={0}
              max={100}
              style={{ margin: '0 16px' }}
              value={allocations[index]}
              onChange={(value) => {
                setAllocations(value, index);
              }}
            />
          </Col>
        </Row>
      );
    },
    width: 350,
  },
];


export const YourPage = () => {
  const [data, setData] = useState(initialData);

  const initialAllocations = data.map((item) => parseInt(item.allocation, 10))
  const [allocations, setAllocations] = useState(initialAllocations);
  const [isUpdating, setIsUpdating] = useState();

  console.log('allocations', allocations);

  const updateAllocations = (value, row) => {
    setAllocations((prev) => {
      const newAllocations = [...prev];
      newAllocations[row] = value;
      return newAllocations;
    });
  };

  const onSubmit = () => {
    setData((prev) => {
      console.log('prev', prev)
      const newData = prev.map((item, index) => ({
        ...item,
        allocation: `${allocations[index]}%`
    }));
      return newData;
    })
  }

  const onCancel = () => {
    setAllocations(initialAllocations);
    setIsUpdating(false)
  }

  return (
    <StyledMain>
      <PathsContainer>
        <h1>Your Staking Allocation </h1>
        {isUpdating ? (
          <>
            <div style={{ display: 'flex', marginBottom: '16px' }}>
              <Button
                type="primary"
                style={{ marginRight: '16px' }}
                onClick={() => {
                  onSubmit()
                  setIsUpdating(false)
                }}
              >
                Submit update
              </Button>
              <Button onClick={onCancel}>Cancel</Button>
            </div>
            <p style={{ marginBottom: '24px', }}>
              <InfoCircleOutlined /> Updates take effect at the start of the next week
            </p>
            {allocations.reduce((prev, item) => prev + item, 0) > 100 && (
              <p style={{ marginBottom: '24px', color: 'red' }}>
                <WarningOutlined /> Sum of allocation should be less that 100%
              </p>
            )}
          </>
        ) : (
          <Button style={{ marginBottom: '16px' }} onClick={() => setIsUpdating(true)}>
            Update
          </Button>
        )}
        <div style={{ maxWidth: isUpdating ? 1000 : 800 }}>
          <Table
            columns={isUpdating ? columnsUpdating(allocations, updateAllocations) : columns}
            dataSource={data}
            pagination={false}
          />
        </div>
      </PathsContainer>
    </StyledMain>
  );
};
