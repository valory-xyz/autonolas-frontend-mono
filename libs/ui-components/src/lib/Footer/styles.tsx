import styled from 'styled-components';

export const FooterContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 50px;

  .footer-center {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
  }
`;
