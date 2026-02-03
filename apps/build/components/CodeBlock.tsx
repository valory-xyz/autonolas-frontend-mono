import styled from 'styled-components';
import { Copy } from './Copy';

const CodeContainer = styled.div`
  padding: 8px;
  align-items: center;
  font-size: 14px;
  background: #f2f4f9;
  border-radius: 8px;
  border-color: #dfe5ee;
  width: fit-content;
  display: flex;
  margin-bottom: 12px;

  code {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;

type CodeBlockProps = {
  canCopy?: boolean;
  children: string;
};

export const CodeBlock = ({ canCopy = false, children }: CodeBlockProps) => {
  return (
    <>
      {canCopy ? (
        <CodeContainer
          style={{
            padding: '8px 8px 8px 16px',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <code>{children}</code>
          <Copy text={children} />
        </CodeContainer>
      ) : (
        <CodeContainer>
          <code>{children}</code>
        </CodeContainer>
      )}
    </>
  );
};
