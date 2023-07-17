import { useState } from 'react';
import PropTypes from 'prop-types';
import { WrapperDiv } from './styles';

export const DOCS_SECTIONS = {
  'off-chain-agent': 'off-chain-agent',
  'on-chain-protocol': 'on-chain-protocol',
  'high-level-spec': 'high-level-spec',
};

/**
 * navigation titles
 */
export const DOC_NAV = [
  {
    id: DOCS_SECTIONS['off-chain-agent'],
    title: 'Off-chain Agent (AI Worker)',
  },
  {
    id: DOCS_SECTIONS['on-chain-protocol'],
    title: 'On-chain Protocol',
  },
  {
    id: DOCS_SECTIONS['high-level-spec'],
    title:
      'High Level Specification of Off-Chain Agents that take input from the AgentMechs',
  },
];

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
