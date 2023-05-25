import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import get from 'lodash/get';
import {
  Form, Input, Button, Select,
} from 'antd/lib';
import { v4 as uuidv4 } from 'uuid';
import { isArray } from 'lodash';
import { getIpfsHashHelper } from './helpers';
import { CustomModal } from '../styles';

export const FORM_NAME = 'ipfs_creation_form_for_mech';

const IpfsModal = ({
  visible, tools, handleCancel, callback,
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

      const hash = await getIpfsHashHelper(
        {
          ...values,
          nonce: uuidv4(),
        },
        { noImage: true },
      );
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

  const handleOk = () => {
    form.submit();
  };

  return (
    <CustomModal
      visible={visible}
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
            onClick={handleOk}
          >
            Save File & Generate Hash
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
  callback: PropTypes.func,
};

IpfsModal.defaultProps = {
  tools: null,
  callback: null,
};

const mapStateToProps = (state) => {
  const account = get(state, 'setup.account') || null;
  return { account };
};

export default connect(mapStateToProps, {})(IpfsModal);
