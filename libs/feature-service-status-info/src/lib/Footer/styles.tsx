import styled from 'styled-components';

export const FooterContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 1rem 50px;
  .footer-left-content {
  }
  .footer-center {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
  }
  .socials {
    display: flex;
    column-gap: 28px;
  }
`;
