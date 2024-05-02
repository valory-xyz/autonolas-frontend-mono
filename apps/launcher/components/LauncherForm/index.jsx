import { Button, Divider, Form, Input, Select } from 'antd';
import React, { useState } from 'react';

import { notifySuccess } from '@autonolas/frontend-library';

import AddServiceContract from './AddServiceContract';

const initialServiceContracts = [
  {
    implementation: 'option1',
    name: 'Create Prediction Market',
    description: 'description1',
    chainId: '100',
  },
];

const LauncherForm = () => {
  const [isLoading = false, setIsLoading] = useState(false);
  const [canAddServiceContract, setCanAddServiceContract] = useState(false);
  const [serviceContracts, setServiceContracts] = useState(initialServiceContracts);
  const [isAddServiceContractModalVisible, setIsAddServiceContractModalVisible] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    setServiceContracts([...serviceContracts, { ...values }]);

    // notify user
    notifySuccess('Service contract created successfully');

    // now user can add service contract
    setCanAddServiceContract(true);

    // reset form
    form.resetFields();
  };
  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <>
      <Form
        form={form}
        name="basic"
        // labelCol={{ span: 8 }}
        // wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        layout="vertical"
        // initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Implementation"
          name="implementation"
          initialValue="create-prediction-market"
          rules={[
            {
              required: true,
              message: 'Please select an implementation!',
            },
          ]}
        >
          <Select disabled>
            <Select.Option value="create-prediction-market">Create Prediction Market</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[
            {
              required: true,
              message: 'Please enter a name!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            {
              required: true,
              message: 'Please enter a description!',
            },
          ]}
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          label="Chain ID"
          name="chainId"
          rules={[
            {
              required: true,
              message: 'Please enter a chain ID!',
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Create
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      <Button
        disabled={!canAddServiceContract}
        onClick={() => setIsAddServiceContractModalVisible(true)}
      >
        Add Service Contract for Voting
      </Button>

      {isAddServiceContractModalVisible && (
        <AddServiceContract
          isOpen={isAddServiceContractModalVisible}
          serviceContracts={serviceContracts}
          onClose={() => setIsAddServiceContractModalVisible(false)}
        />
      )}
    </>
  );
};

export default LauncherForm;
