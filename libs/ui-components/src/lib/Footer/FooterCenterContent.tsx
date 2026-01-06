import { Typography } from 'antd';
import { ReactNode } from 'react';

export const DISCLAIMER_URL = 'https://olas.network/disclaimer';
export const DAO_CONSTITUTION_URL =
  'https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u';

type FooterCenterContentProps = {
  operatorName?: string;
  fontSize?: number;
  className?: string;
  children?: ReactNode;
};

export const FooterCenterContent = ({
  fontSize,
  className,
  children,
}: FooterCenterContentProps) => {
  const textStyle = fontSize ? { fontSize } : undefined;

  return (
    <Typography.Text type="secondary" style={textStyle} className={className}>
      {children || (
        <>
          {`© OLAS DAO ${new Date().getFullYear()} • `}
          <a href={DISCLAIMER_URL} target="_blank" rel="noopener noreferrer">
            Disclaimer
          </a>
          {' • '}
          <a href={DAO_CONSTITUTION_URL} target="_blank" rel="noopener noreferrer">
            DAO Constitution
          </a>
        </>
      )}
    </Typography.Text>
  );
};
