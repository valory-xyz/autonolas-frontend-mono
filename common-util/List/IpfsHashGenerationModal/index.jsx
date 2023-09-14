import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button } from 'antd';

import { getIpfsHashHelper } from './helpers';
import { CustomModal } from '../styles';

export const FORM_NAME = 'ipfs_creation_form';

const IpfsModal = ({
  visible, type, onUpdateHash, handleCancel, callback,
}) => {
  const [form] = Form.useForm();
  const [isHashLoading, setIsHashLoading] = useState(false);

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

  const onModalClose = () => {
    handleCancel();
  };

  const getNewHash = async (values) => {
    try {
      setIsHashLoading(true); // loading on!

      const hash = await getIpfsHashHelper(values);
      if (callback) callback(hash);
      onModalClose();

      return hash;
    } catch (error) {
      window.console.log(error);
    } finally {
      setIsHashLoading(false); // off the loader and close the `Modal`
    }

    return null;
  };

  const onFinish = async (values) => {
    const hash = await getNewHash(values);
    if (callback) callback(hash);
  };

  const handleUpdate = () => {
    form.validateFields().then(async (values) => {
      const hash = await getNewHash(values);
      onUpdateHash(hash);
      if (callback) callback(hash);
    });
  };

  const handleOk = () => {
    form.submit();
  };

  return (
    <CustomModal
      open={visible}
      centered
      title="Generate IPFS Hash of Metadata File"
      okText="Copy Hash & Close"
      cancelText="Cancel"
      destroyOnClose
      width={620}
      onCancel={handleCancel}
      footer={[
        <Fragment key="footer-1">
          <Button type="default" onClick={onModalClose}>
            Cancel
          </Button>

          <Button
            form="myForm"
            htmlType="submit"
            type="primary"
            loading={isHashLoading}
            onClick={onUpdateHash ? handleUpdate : handleOk}
          >
            {onUpdateHash
              ? 'Save File & Update Hash'
              : 'Save File & Generate Hash'}
          </Button>
        </Fragment>,
      ]}
    >
      <Form
        form={form}
        name={FORM_NAME}
        layout="vertical"
        autoComplete="off"
        preserve={false}
        id="myForm"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: `Please input the name of the ${type}` },
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
              message: `Please input the description of the ${type}`,
            },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Input Format"
          name="inputFormat"
          rules={[
            {
              required: true,
              message: 'Please input the input format the agent accepts',
            },
          ]}
        >
          <Input placeholder="ipfs-v0.1" />
        </Form.Item>

        <Form.Item
          label="Output Format"
          name="outputFormat"
          rules={[
            {
              required: true,
              message: 'Please input the output format the agent accepts',
            },
          ]}
        >
          <Input placeholder="ipfs-v0.1" />
        </Form.Item>

        <Form.Item
          label="NFT Image URL"
          name="image"
          extra="Represents your NFT on marketplaces such as OpenSea"
          rules={[{ required: true, message: 'Please input the image link' }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </CustomModal>
  );
};

IpfsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  type: PropTypes.string,
  onUpdateHash: PropTypes.func,
  handleCancel: PropTypes.func.isRequired,
  callback: PropTypes.func,
};

IpfsModal.defaultProps = {
  type: '',
  onUpdateHash: null,
  callback: null,
};

export default IpfsModal;
