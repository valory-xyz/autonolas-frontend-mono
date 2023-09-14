import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form } from 'antd';

import { useHelpers } from 'common-util/hooks/useHelpers';
import { FormItemHash } from '../RegisterForm/helpers';
import HashOfDataFile from '../IpfsHashGenerationModal/HashOfDataFile';
import { RegisterMessage } from '../ListCommon';

export const FORM_NAME = 'request_form';

const RequestForm = ({
  isLoading, dataList, handleSubmit, handleCancel,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [fields, setFields] = useState([]);
  const { account } = useHelpers();

  const onGenerateHash = (generatedHash) => {
    setFields([
      {
        name: ['hash'],
        value: generatedHash || null,
      },
    ]);
  };

  const onFinish = (values) => {
    if (account) {
      handleSubmit(values);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

  const hashValue = form.getFieldValue('hash');

  return (
    <>
      <Form
        form={form}
        name={FORM_NAME}
        initialValues={{ remember: true }}
        fields={fields}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <FormItemHash hashValue={hashValue} />

        <Button
          type="primary"
          ghost
          onClick={() => setIsModalVisible(true)}
          className="mb-12"
        >
          Generate Hash & File
        </Button>

        {account ? (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Submit
            </Button>
          </Form.Item>
        ) : (
          <RegisterMessage handleCancel={handleCancel} />
        )}
      </Form>

      <HashOfDataFile
        visible={isModalVisible}
        tools={dataList}
        callback={onGenerateHash}
        handleCancel={() => setIsModalVisible(false)}
      />
    </>
  );
};

RequestForm.propTypes = {
  isLoading: PropTypes.bool,
  dataList: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  handleSubmit: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
};

RequestForm.defaultProps = {
  isLoading: false,
  dataList: null,
};

export default RequestForm;
