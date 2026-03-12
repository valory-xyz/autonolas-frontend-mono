import { Typography } from 'antd';
import { ReactNode } from 'react';

import { Socials } from './Socials';
import { FooterContainer } from './styles';

export { FooterCenterContent, DISCLAIMER_URL, DAO_CONSTITUTION_URL } from './FooterCenterContent';

type FooterProps = {
  leftContent?: ReactNode;
  centerContent?: ReactNode;
  githubUrl: string;
};

const defaultCenterContent = (
  <Typography.Text type="secondary">
    ©&nbsp;Valory&nbsp;
    {new Date().getFullYear()}
  </Typography.Text>
);

export const Footer = ({ leftContent, centerContent, githubUrl }: FooterProps) => (
  <FooterContainer>
    <div>{leftContent}</div>

    <div className="footer-center">{centerContent || defaultCenterContent}</div>

    <Socials githubUrl={githubUrl} />
  </FooterContainer>
);
