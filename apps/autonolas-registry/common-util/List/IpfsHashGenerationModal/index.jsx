import { Button, Flex, Form, Input, Select } from 'antd';
import isNil from 'lodash/isNil';
import PropTypes from 'prop-types';
import React, { Fragment, useState } from 'react';

import { notifyError, notifySuccess } from '@autonolas/frontend-library';

import { HASH_PREFIXES } from 'util/constants';

import { notifyWrongNetwork } from '../../functions';
import { useHelpers } from '../../hooks';
import { CustomModal } from '../styles';
import { getIpfsHashHelper } from './helpers';

export const FORM_NAME = 'ipfs_creation_form';

export const getBase16Validator = (value, hashType = HASH_PREFIXES.type1) => {
  if (isNil(value) || value === '') {
    return Promise.resolve();
  }

  if (hashType === HASH_PREFIXES.type1) {
    // only 64 characters long valid Hash
    if (value.length === 64 && /[0-9a-f]/gm.test(value)) {
      return Promise.resolve();
    }
  }

  if (hashType === HASH_PREFIXES.type2) {
    if (value.length === 52 && /[0-9a-z]/gm.test(value)) {
      return Promise.resolve();
    }
  }

  return Promise.reject(new Error('Please input a valid hash'));
};

export const IpfsHashGenerationModal = ({
  visible,
  type,
  handleHashUpdate,
  handleCancel,
  callback,
}) => {
  const { isConnectedToWrongNetwork } = useHelpers();

  const [form] = Form.useForm();
  const [isHashLoading, setIsHashLoading] = useState(false);
  const [hashType, setHashType] = useState(HASH_PREFIXES.type1);

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

  const onModalClose = () => {
    handleCancel();
  };

  const getNewHash = async (values) => {
    try {
      setIsHashLoading(true);

      const hash = await getIpfsHashHelper(values, hashType);
      if (callback) callback(hash);

      return hash;
    } catch (error) {
      console.error(error);
      notifyError('Error generating hash');
    } finally {
      setIsHashLoading(false);
    }

    return null;
  };

  const onFinish = async (values) => {
    try {
      const hash = await getNewHash(values);
      if (callback) callback(hash);

      onModalClose();
    } catch (error) {
      notifyError('Error generating hash');
    }
  };

  const handleUpdate = async () => {
    const getHashFormFields = async () => {
      try {
        const fields = await form.validateFields();
        return fields;
      } catch (e) {
        notifyError('Please fill all the fields');
        return null;
      }
    };

    try {
      if (isConnectedToWrongNetwork) {
        notifyWrongNetwork();
        return;
      }

      const values = await getHashFormFields();
      if (!values) return;

      const hash = await getNewHash(values);
      await handleHashUpdate(hash);

      notifySuccess('Hash updated');
      if (callback) callback(hash);
      onModalClose();
    } catch (e) {
      notifyError('Error updating hash');
      console.error(e);
    }
  };

  const handleOk = () => form.submit();

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
          <Button size="large" type="default" onClick={onModalClose}>
            Cancel
          </Button>

          <Button
            size="large"
            form="myForm"
            htmlType="submit"
            type="primary"
            loading={isHashLoading}
            onClick={handleHashUpdate ? handleUpdate : handleOk}
          >
            {handleHashUpdate ? 'Save File & Update Hash' : 'Save File & Generate Hash'}
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
          rules={[{ required: true, message: `Please input the name of the ${type}` }]}
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
          label="Version"
          name="version"
          rules={[{ required: true, message: 'Please input the version' }]}
        >
          <Input placeholder="1" style={{ width: 100 }} />
        </Form.Item>

        <Form.Item
          name="code_uri"
          label="Package hash"
          extra="Hash should point to the package"
          rules={[
            {
              required: true,
              message: 'Please input the Package hash',
            },
            () => ({
              validator(_, value) {
                return getBase16Validator(value, hashType);
              },
            }),
          ]}
        >
          <Input
            addonBefore={
              <Select
                defaultValue={hashType}
                className="select-before"
                onChange={(e) => setHashType(e)}
              >
                <Select.Option value={HASH_PREFIXES.type1}>{HASH_PREFIXES.type1}</Select.Option>
                <Select.Option value={HASH_PREFIXES.type2}>{HASH_PREFIXES.type2}</Select.Option>
              </Select>
            }
          />
        </Form.Item>

        <Form.Item
          label="NFT Image URL"
          name="image"
          extra={
            <Flex vertical>
              <span>
                Represents your NFT on marketplaces such as OpenSea. Current supported domains are:
              </span>
              <span>
                {/* TODO: fetch from middleware constant */}
                <ul style={{ margin: 0 }}>
                  <li>ipfs://*</li>
                  <li>https://gateway.autonolas.tech/ipfs/*</li>
                  <li>https://gateway.pinata.cloud/ipfs/*</li>
                  <li>https://*.arweave.net/</li>
                </ul>
              </span>
            </Flex>
          }
        >
          <Input placeholder="ipfs://" />
        </Form.Item>
      </Form>
    </CustomModal>
  );
};

IpfsHashGenerationModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  type: PropTypes.string,
  handleHashUpdate: PropTypes.func,
  handleCancel: PropTypes.func.isRequired,
  callback: PropTypes.func,
};

IpfsHashGenerationModal.defaultProps = {
  type: '',
  handleHashUpdate: null,
  callback: null,
};
