import { useState } from 'react';

import { WrapperDiv } from './styles';

export const DOCS_SECTIONS = {
  overview: 'overview',
  'quick-start': 'quick-start',
  'core-concepts': 'core-concepts',
  'how-to-use': 'how-to-use',
  'how-to-propose': 'how-to-propose',
  'how-it-works': 'how-it-works',
  faq: 'faq',
};

/**
 * navigation titles
 */
export const DOC_NAV = [
  { id: DOCS_SECTIONS.overview, title: 'Overview' },
  { id: DOCS_SECTIONS['quick-start'], title: 'Quick Start' },
  { id: DOCS_SECTIONS['core-concepts'], title: 'Core Concepts' },
  { id: DOCS_SECTIONS['how-to-use'], title: 'How to Use Olas Contribute' },
  // { id: DOCS_SECTIONS['how-to-propose'], title: 'How to Propose a Post' },
  { id: DOCS_SECTIONS['how-it-works'], title: 'How It Works' },
  { id: DOCS_SECTIONS.faq, title: 'Troubleshooting / FAQs' },
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
