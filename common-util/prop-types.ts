import PropTypes from 'prop-types';

const Voter = PropTypes.shape({
  address: PropTypes.string,
  signature: PropTypes.string,
  /**
   * For backward compatibility, we need to support the old format of
   * votingPower, which is a string.
   */
  votingPower: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

const ProposerPropTypes = PropTypes.shape({
  address: PropTypes.string.isRequired, // address of the proposer
  signature: PropTypes.string, // signature of the message signed

  // if the signature is validated, initially null
  verified: PropTypes.bool,
});

export const ProposalPropTypes = PropTypes.shape({
  // unique id of the proposal
  request_id: PropTypes.string.isRequired,

  // proposal creation date
  createdDate: PropTypes.number.isRequired,

  // tweet = the `text` is string
  // thread = the `text` is array of string (array of tweets)
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,

  // if the tweet is posted
  posted: PropTypes.bool.isRequired,

  // proposer details
  proposer: ProposerPropTypes.isRequired,

  // list of voters that approved the tweet
  voters: PropTypes.arrayOf(Voter),

  executionAttempts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      // initally null, backend will set to true if verified
      verified: PropTypes.bool,
      dateCreated: PropTypes.number.isRequired,
    }),
  ),

  // link to the actual tweet
  action_id: PropTypes.string.isRequired,
});

export const ProposalsPropTypes = PropTypes.arrayOf(ProposalPropTypes);

export const MembersPropTypes = PropTypes.shape({
  address: PropTypes.string.isRequired,
  ownership: PropTypes.number.isRequired,
});

export const MessagesPropTypes = PropTypes.shape({
  member: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
});

export const ActionsPropTypes = PropTypes.shape({
  commitId: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  actorAddress: PropTypes.string.isRequired,
});

export const CentaurPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  memory: PropTypes.arrayOf(PropTypes.string),
  members: PropTypes.arrayOf(MembersPropTypes),
  purpose: PropTypes.string.isRequired,
  settings: PropTypes.shape({
    public_chat: PropTypes.bool,
  }),
  messages: PropTypes.arrayOf(MessagesPropTypes),
  actions: PropTypes.arrayOf(ActionsPropTypes),
  plugins_data: PropTypes.shape({
    daily_orbis: PropTypes.shape({}),
    daily_tweet: PropTypes.shape({}),
    scheduled_tweet: PropTypes.shape({
      tweets: ProposalsPropTypes,
    }),
  }),

  configuration: PropTypes.shape({
    memberWhitelist: PropTypes.arrayOf(PropTypes.string),
  }),
});
