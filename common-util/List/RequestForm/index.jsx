import { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Web3 from 'web3';
import { Button, Form, Input } from 'antd/lib';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import { WhiteButton } from 'common-util/Button';
import { RegisterFooter, ComplexLabel } from '../styles';

export const FORM_NAME = 'request_form';

const RequestForm = ({
  account, listType, handleSubmit, handleCancel,
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fields, setFields] = useState([]);

  const onFinish = (values) => {
    if (account) {
      handleSubmit(values);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo); /* eslint-disable-line no-console */
  };

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
        <Form.Item
          label="Data"
          name="data"
          validateFirst
          rules={[
            {
              required: true,
              message: `Please input the data`,
            },
            () => ({
              validator(_, value) {
                if (true) return Promise.resolve();
                return Promise.reject(
                  new Error(
                    `Please input the data`,
                  ),
                );
              },
            }),
          ]}
          className="mb-0"
        >
          <Input placeholder="0xffff..." />
        </Form.Item>

        {account ? (
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        ) : (
          <RegisterFooter>
            <p>To mint, connect to wallet</p>
            <WhiteButton onClick={handleCancel}>Cancel</WhiteButton>
          </RegisterFooter>
        )}
      </Form>
    </>
  );
};

RequestForm.propTypes = {
  account: PropTypes.string,
  listType: PropTypes.string,
  handleSubmit: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
};

RequestForm.defaultProps = {
  account: null,
  listType: '',
};

const mapStateToProps = (state) => {
  const account = get(state, 'setup.account') || null;
  return { account };
};

export default connect(mapStateToProps, {})(RequestForm);