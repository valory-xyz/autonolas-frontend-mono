import { Typography } from 'antd';

import { Socials } from './Socials';
import { FooterContainer } from './styles';

type FooterProps = {
  leftContent?: JSX.Element;
  centerContent?: JSX.Element;
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
