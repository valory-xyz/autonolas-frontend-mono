/* eslint-disable import/no-extraneous-dependencies */
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
