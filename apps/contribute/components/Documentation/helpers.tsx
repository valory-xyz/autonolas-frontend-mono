import { useState } from 'react';

import { WrapperDiv } from './styles';

export const DOCS_SECTIONS = {
  overview: 'overview',
  leaderboard: 'leaderboard',
  actions: 'actions',
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
  { id: DOCS_SECTIONS.tweet, title: 'Post' },
  { id: DOCS_SECTIONS.proposals, title: 'Proposals' },
  { id: DOCS_SECTIONS['how-it-works'], title: 'How It Works' },
];

type NavWrapperProps = {
  isMobile: boolean;
  children: React.ReactNode;
};

/**
 * navigation wrapper
 */
export const NavWrapper = ({ isMobile, children }: NavWrapperProps) => {
  const [isOpen, setOpen] = useState<boolean | null>(null);
  const handleOpen = () => {
    setOpen(!isOpen);
  };

  if (isMobile) {
    return (
      <WrapperDiv>
        <div
          className="text"
          role="button"
          tabIndex={0}
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
