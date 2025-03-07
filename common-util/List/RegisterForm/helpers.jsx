import { LinkOutlined } from '@ant-design/icons';
import { Form, Input, Tooltip } from 'antd';
import PropTypes from 'prop-types';

import { GATEWAY_URL, HASH_PREFIX } from 'util/constants';

import { getBase16Validator } from '../IpfsHashGenerationModal/utils';

export const FormItemHash = ({ hashValue }) => (
  <Form.Item
    label="Hash of Metadata File"
    name="hash"
    rules={[
      {
        required: true,
        message: 'Please input the IPFS hash',
      },
      () => ({
        validator(_, value) {
          return getBase16Validator(value);
        },
      }),
    ]}
  >
    <Input
      disabled
      addonBefore={HASH_PREFIX}
      addonAfter={
        <Tooltip title={hashValue ? 'Click to open the generated hash' : 'Please generate hash'}>
          <LinkOutlined
            style={hashValue ? {} : { cursor: 'not-allowed' }}
            onClick={() => {
              if (hashValue) {
                window.open(`${GATEWAY_URL}${HASH_PREFIX}${hashValue}`, '_blank');
              }
            }}
          />
        </Tooltip>
      }
    />
  </Form.Item>
);

FormItemHash.propTypes = {
  hashValue: PropTypes.string,
};

FormItemHash.defaultProps = {
  hashValue: null,
};
