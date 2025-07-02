import PropTypes from 'prop-types';
import React from 'react';
import Moment from 'react-moment';

import { areAddressesEqual } from '@autonolas/frontend-library';

import { DisplayName } from 'common-util/DisplayName';

import { MessageBody, MessageContainer, MessageGroup, MessageTimestamp } from './styles';

export const MessageGroupContainer = ({ dateKey, address, account, username, groupedMessages }) => (
  <MessageGroup key={`${dateKey}-${address}`}>
    <div className="mb-4">
      <DisplayName actorAddress={address} account={account} username={username} />
      {areAddressesEqual(address, account) && ' (You)'}
    </div>
    {groupedMessages?.map((msg, index) => (
      <div key={`${msg.content?.context}-${msg.timestamp}`}>
        <div className={`mb-4 ${index === 0 ? 'mt-2' : ''}`}>
          <MessageContainer>
            <MessageBody>{msg.content?.body}</MessageBody>
            <MessageTimestamp type="secondary">
              <Moment unix format="HH:mm">
                {msg.timestamp}
              </Moment>
            </MessageTimestamp>
          </MessageContainer>
        </div>
      </div>
    ))}
  </MessageGroup>
);

// TODO move to prop-types.js where relevant
MessageGroupContainer.propTypes = {
  dateKey: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  account: PropTypes.string.isRequired,
  username: PropTypes.string,
  groupedMessages: PropTypes.array.isRequired,
};

MessageGroupContainer.defaultProps = {
  username: '',
};
