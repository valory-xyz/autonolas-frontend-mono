import { CopyOutlined } from '@ant-design/icons';
import { handleCopy } from 'util/helpers';
import PropTypes from 'prop-types';

export const Copy = ({ copyText }) => (
  <CopyOutlined onClick={() => {
    handleCopy(copyText);
  }}
  />
);

Copy.propTypes = {
  copyText: PropTypes.string.isRequired,
};
