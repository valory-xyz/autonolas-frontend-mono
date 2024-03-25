import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';

import HashOfDataFile from '../IpfsHashGenerationModal/HashOfDataFile';

export const FORM_NAME = 'request_form';

const RequestForm = ({
  isLoading, dataList, handleSubmit,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Button
        type="primary"
        ghost
        onClick={() => setIsModalVisible(true)}
        className="mb-12"
      >
        New request
      </Button>

      <HashOfDataFile
        visible={isModalVisible}
        tools={dataList}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        handleCancel={() => setIsModalVisible(false)}
      />
    </>
  );
};

RequestForm.propTypes = {
  isLoading: PropTypes.bool,
  dataList: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  handleSubmit: PropTypes.func.isRequired,
};

RequestForm.defaultProps = {
  isLoading: false,
  dataList: null,
};

export default RequestForm;
