import { useState } from 'react';
import styled from 'styled-components';

const CopyButton = styled.button`
  border: none;
  background: none;
  padding: 2px;
  display: flex;
  margin-top: auto;
  cursor: pointer;
  align-items: center;
  gap: 4px;

  svg path {
    transition: fill 0.15s ease;
  }

  &:hover svg path {
    fill: #3d4d5f;
  }
`;

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M12.25 5.83333C12.25 5.51117 11.9888 5.25 11.6666 5.25H5.83331C5.51115 5.25 5.24998 5.51117 5.24998 5.83333V11.6667C5.24998 11.9888 5.51115 12.25 5.83331 12.25H11.6666C11.9888 12.25 12.25 11.9888 12.25 11.6667V5.83333ZM8.74998 2.33333C8.74998 2.01383 8.48615 1.75 8.16665 1.75H2.33331C2.01381 1.75 1.74998 2.01383 1.74998 2.33333V8.16667C1.74998 8.48617 2.01381 8.75 2.33331 8.75C2.65548 8.75 2.91665 9.01117 2.91665 9.33333C2.91665 9.6555 2.65548 9.91667 2.33331 9.91667C1.36948 9.91667 0.583313 9.1305 0.583313 8.16667V2.33333C0.583313 1.3695 1.36948 0.583333 2.33331 0.583333H8.16665C9.13048 0.583333 9.91665 1.3695 9.91665 2.33333C9.91665 2.6555 9.65548 2.91667 9.33331 2.91667C9.01115 2.91667 8.74998 2.6555 8.74998 2.33333ZM13.4166 11.6667C13.4166 12.6332 12.6331 13.4167 11.6666 13.4167H5.83331C4.86682 13.4167 4.08331 12.6332 4.08331 11.6667V5.83333C4.08331 4.86684 4.86682 4.08333 5.83331 4.08333H11.6666C12.6331 4.08333 13.4166 4.86684 13.4166 5.83333V11.6667Z"
      fill="#606F85"
    />
  </svg>
);

const CopiedText = styled.span`
  font-size: 12px;
  color: #3d4d5f;
`;

export const Copy = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CopyButton onClick={handleClick}>
      {copied ? (
        <CopiedText>Copied</CopiedText>
      ) : (
        <CopyIcon />
      )}
    </CopyButton>
  );
};
