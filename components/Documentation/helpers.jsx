import { useState } from 'react';
import PropTypes from 'prop-types';
import { WrapperDiv } from './styles';

export const DOCS_SECTIONS = {
  overview: 'overview',
  actions: 'actions',
  badge: 'badge',
  leaderboard: 'leaderboard',
  'how-it-works': 'how-it-works',
};

/**
 * navigation titles
 */
export const DOC_NAV = [
  {
    id: DOCS_SECTIONS.overview,
    title: 'Off-chain Agent (AI Worker)',
  },
  {
    id: DOCS_SECTIONS.actions,
    title: 'On-chain Protocol',
  },
  {
    id: DOCS_SECTIONS.badge,
    title: 'High Level Specification of Off-Chain Agents that take input from the AgentMechs',
  },
  // {
  //   id: DOCS_SECTIONS.leaderboard,
  //   title: 'Leaderboard',
  // },
  // {
  //   id: DOCS_SECTIONS['how-it-works'],
  //   title: 'How It Works',
  // },
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
