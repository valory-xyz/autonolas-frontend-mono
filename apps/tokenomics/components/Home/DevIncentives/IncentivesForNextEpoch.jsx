import { useState } from 'react';
import {
  Radio,
  Form,
  Button,
  InputNumber,
  Typography,
  Row,
  Col,
  Grid,
  Table,
} from 'antd';
import { notifyError } from '@autonolas/frontend-library';

import { useHelpers } from 'common-util/hooks/useHelpers';
import { getMapUnitIncentivesRequest } from './requests';
import { MapPendingIncentivesContainer } from './styles';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const columns = [
  {
    title: 'Pending Reward (ETH)',
    dataIndex: 'pendingRelativeReward',
    key: 'pendingRelativeReward',
  },
  // TODO: do the calculation later, as it is complicated
  // {
  //   title: 'Pending Topup',
  //   dataIndex: 'pendingRelativeTopUp',
  //   key: 'pendingRelativeTopUp',
  // },
];

export const IncentivesForNextEpoch = () => {
  const { account } = useHelpers();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingIncentives, setPendingIncentives] = useState([]);
  const screens = useBreakpoint();

  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      setIsLoading(true);

      const response = await getMapUnitIncentivesRequest({
        unitType: values.unitType,
        unitId: `${values.unitId}`,
      });
      setPendingIncentives([response]);
    } catch (error) {
      notifyError('Error on fetching incentives');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MapPendingIncentivesContainer>
      <Title level={3}>Estimate rewards for next epoch</Title>
      <Paragraph style={{ maxWidth: 550 }}>
        Note that the rewards claimable from the next epoch are estimated, as
        they might eventually change during the epoch due to other donations.
      </Paragraph>

      <Row>
        <Col lg={14} xs={24}>
          <Form
            form={form}
            name="dynamic_form_complex_incentives"
            onFinish={onFinish}
            layout="inline"
            autoComplete="off"
          >
            <Form.Item
              label="Unit Type"
              name="unitType"
              rules={[{ required: true, message: 'Please add unit type' }]}
            >
              <Radio.Group>
                <Radio value="1">Agent</Radio>
                <Radio value="0">Component</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Unit ID"
              name="unitId"
              rules={[{ required: true, message: 'Please add unit Id' }]}
            >
              <InputNumber min={0} className="mr-24" placeholder="Eg. 1" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={!account}
              >
                Estimate
              </Button>

              {!account && (
                <Text
                  className="ml-8"
                  type="secondary"
                  style={
                    screens.xs ? { display: 'block' } : { display: 'inline' }
                  }
                >
                  To check rewards, connect a wallet
                </Text>
              )}
            </Form.Item>
          </Form>
        </Col>

        <Col lg={10} xs={24}>
          {pendingIncentives.length > 0 && (
            <Table
              columns={columns}
              dataSource={pendingIncentives}
              bordered
              pagination={false}
            />
          )}
        </Col>
      </Row>
    </MapPendingIncentivesContainer>
  );
};
