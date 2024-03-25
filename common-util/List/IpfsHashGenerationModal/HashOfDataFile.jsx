import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form, Input, Button, Select,
} from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { isArray } from 'lodash';
import { useHelpers } from 'common-util/hooks/useHelpers';

import { getIpfsHashHelper } from './helpers';
import { CustomModal } from '../styles';

export const FORM_NAME = 'ipfs_creation_form_for_mech';

const IpfsModal = ({
  visible, tools, handleCancel, handleSubmit, isLoading,
}) => {
  const [form] = Form.useForm();
  const [isHashLoading, setIsHashLoading] = useState(false);

  const { account } = useHelpers();

  const onModalClose = () => {
    handleCancel();
  };

  const getNewHash = async (values) => {
    try {
      setIsHashLoading(true); // loading on!

      const hash = await getIpfsHashHelper(
        {
          ...values,
          nonce: uuidv4(),
        },
        { noImage: true },
      );
      return hash;
    } catch (error) {
      window.console.log(error);
    } finally {
      setIsHashLoading(false); // off the loader
    }

    return null;
  };

  const onFinish = async (values) => {
    const hash = await getNewHash(values);

    handleSubmit({
      ...values,
      hash,
    }, onModalClose);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

  return (
    <CustomModal
      open={visible}
      title="New request"
      okText="Copy Hash & Close"
      cancelText="Cancel"
      destroyOnClose
      width={620}
      onCancel={handleCancel}
      footer={[
        <Fragment key="footer-1">
          <div>
            <Button type="default" onClick={onModalClose}>
              Cancel
            </Button>

            <Button
              form="ipfsModalForm"
              htmlType="submit"
              type="primary"
              disabled={!account}
              loading={isHashLoading || isLoading}
            >
              Request
            </Button>
          </div>
          {!account && <div className="text-gray-500 mt-12">To make a request, connect your wallet</div>}
        </Fragment>,
      ]}
    >
      <Form
        form={form}
        name={FORM_NAME}
        layout="vertical"
        autoComplete="off"
        preserve={false}
        id="ipfsModalForm"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="Prompt"
          name="prompt"
          rules={[{ required: true, message: 'Please input the prompt' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Tool"
          name="tool"
          rules={[
            {
              required: true,
              message: 'Please input the tool',
            },
          ]}
        >
          {/* if "tools" has valid elements show dropdown, else input */}
          {isArray(tools) && tools.length > 0 ? (
            <Select
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              placeholder="Select a tool"
              options={tools.map((e) => ({
                key: e,
                value: e,
                label: e,
              }))}
            />
          ) : (
            <Input />
          )}
        </Form.Item>
      </Form>
    </CustomModal>
  );
};

IpfsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  handleCancel: PropTypes.func.isRequired,
  tools: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  handleSubmit: PropTypes.func,
  isLoading: PropTypes.bool,
};

IpfsModal.defaultProps = {
  tools: null,
  handleSubmit: null,
  isLoading: false,
};

export default IpfsModal;
