/* eslint-disable import/no-extraneous-dependencies */
import { Alert } from 'antd';
import PropTypes from 'prop-types';

import { EmptyMessage } from 'components/styles';

export const ListEmptyMessage = ({ type }) => {
  const getValues = () => {
    switch (type) {
      case 'component':
        return {
          text: 'component',
        };
      case 'operator':
        return {
          text: 'operator',
        };
      case 'agent':
        return {
          text: 'agent',
        };
      case 'service':
        return {
          text: 'service',
        };
      default:
        return null;
    }
  };

  const currentType = getValues();

  if (!currentType) {
    return <EmptyMessage>Please check type!</EmptyMessage>;
  }

  return (
    <EmptyMessage data-testid="not-registered-message">
      <div className="empty-message-logo" />
      <p>{`No ${currentType.text}s registered`}</p>
    </EmptyMessage>
  );
};
ListEmptyMessage.propTypes = { type: PropTypes.string };
ListEmptyMessage.defaultProps = { type: null };

// AlertSuccess
export const AlertSuccess = ({ type, information }) => {
  if (!information) return null;
  return (
    <Alert
      message={type ? `${type} minted` : 'Minted successfully'}
      type="success"
      data-testid="alert-info-container"
      showIcon
    />
  );
};
AlertSuccess.propTypes = {
  information: PropTypes.shape({}),
  type: PropTypes.string,
};
AlertSuccess.defaultProps = {
  information: null,
  type: null,
};

// AlertError
export const AlertError = ({ error }) => {
  if (!error) return null;
  return (
    <Alert message={error.message} data-testid="alert-error-container" type="error" showIcon />
  );
};
AlertError.propTypes = {
  error: PropTypes.shape({ message: PropTypes.string }),
};
AlertError.defaultProps = { error: null };
