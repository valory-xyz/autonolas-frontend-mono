import { Button, Flex, Form, Modal, Select } from 'antd';
import { useState } from 'react';

import { notifySuccess } from '@autonolas/frontend-library';

import { kebabCase } from 'lodash';

const { Option } = Select;

const AddServiceContract = ({ isOpen, serviceContracts = [], onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    // notify user
    notifySuccess('Service contract added successfully');

    // close modal
    onClose();
  };

  return (
    <Modal
      title="Available Services"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      width={600}
      footer={null}
    >
      <br />
      <Form onFinish={handleSubmit}>
        <Form.Item name="serviceContract" label="Service Contract">
          <Select>
            {serviceContracts.map((contract) => (
              <Option key={kebabCase(contract.name)} value={contract.name}>
                {contract.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Flex align="flex-end" justify="flex-end">
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Add
            </Button>
          </Form.Item>
        </Flex>
      </Form>
    </Modal>
  );
};

export default AddServiceContract;
