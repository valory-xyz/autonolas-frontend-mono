import { Button, Flex, Form, Input, Modal, Select } from 'antd';
import { isArray } from 'lodash';
import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import { useHelpers } from 'common-util/hooks/useHelpers';

import { getIpfsHashHelper } from './helpers';

const FORM_NAME = 'ipfs_creation_form_for_mech';

export const CustomModal = styled(Modal)`
  .ant-typography {
    margin: 0;
  }
`;

type RequestFormProps = {
  visible: boolean;
  tools?: string[] | string | null;
  onCancel: () => void;
  onSubmit?: (values: any, onModalClose: () => void) => void;
  isLoading?: boolean;
};

export const RequestFormLegacy: React.FC<RequestFormProps> = ({
  visible,
  tools = null,
  onCancel,
  onSubmit = () => {},
  isLoading = false,
}) => {
  const [form] = Form.useForm();
  const [isHashLoading, setIsHashLoading] = useState(false);

  const { account } = useHelpers();

  const getNewHash = async (values: any): Promise<string | null> => {
    try {
      setIsHashLoading(true);

      const hash = await getIpfsHashHelper(
        {
          ...values,
          nonce: uuidv4(),
        },
        { noImage: true },
      );
      return hash;
    } catch (error) {
      console.error(error);
    } finally {
      setIsHashLoading(false);
    }

    return null;
  };

  const handleFinish = async (values: any) => {
    const hash = await getNewHash(values);

    onSubmit(
      {
        ...values,
        hash,
      },
      onCancel,
    );
  };

  return (
    <CustomModal
      open={visible}
      title="New request"
      okText="Copy Hash & Close"
      cancelText="Cancel"
      destroyOnClose
      width={620}
      onCancel={onCancel}
      footer={[
        <Fragment key="footer-1">
          <Flex gap={8} justify="end">
            <Button type="default" onClick={onCancel}>
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
          </Flex>
          {!account && (
            <div className="text-gray-500 mt-12">To make a request, connect your wallet</div>
          )}
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
        onFinish={handleFinish}
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
          {isArray(tools) && tools.length > 0 ? (
            <Select
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
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
