import PropTypes from 'prop-types';
import { useState } from 'react';

import { WrapperDiv } from './styles';

export const DOCS_SECTIONS = {
  overview: 'overview',
  leaderboard: 'leaderboard',
  actions: 'actions',
  badge: 'badge',
  members: 'members',
  chatbot: 'chatbot',
  memory: 'memory',
  predict: 'predict',
  tweet: 'post',
  proposals: 'proposals',
  'how-it-works': 'how-it-works',
};

/**
 * navigation titles
 */
export const DOC_NAV = [
  { id: DOCS_SECTIONS.overview, title: 'Overview' },
  { id: DOCS_SECTIONS.leaderboard, title: 'Leaderboard' },
  { id: DOCS_SECTIONS.actions, title: 'Actions' },
  // { id: DOCS_SECTIONS.badge, title: 'Badge' },
  // { id: DOCS_SECTIONS.members, title: 'Members' },
  // { id: DOCS_SECTIONS.chatbot, title: 'Chatbot' },
  // { id: DOCS_SECTIONS.memory, title: 'Memory' },
  { id: DOCS_SECTIONS.tweet, title: 'Post' },
  // { id: DOCS_SECTIONS.predict, title: 'Predict' },
  { id: DOCS_SECTIONS.proposals, title: 'Proposals' },
  { id: DOCS_SECTIONS['how-it-works'], title: 'How It Works' },
];

/**
 * navigation wrapper
 */
export const NavWrapper = ({ isMobile, children }) => {
  const [isOpen, setOpen] = useState(null);
  const handleOpen = () => {
    setOpen(!isOpen);
  };

  if (isMobile) {
    return (
      <WrapperDiv>
        <div
          className="text"
          role="button"
          tabIndex="0"
          onKeyDown={handleOpen}
          onClick={handleOpen}
        >
          LIST OF CONTENTS
        </div>
        <div className="documentation-chapters">{isOpen && children}</div>
      </WrapperDiv>
    );
  }

  return <>{children}</>;
};

NavWrapper.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  children: PropTypes.oneOfType([PropTypes.element]).isRequired,
};
