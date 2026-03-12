import { Button, Col, Image } from 'antd';
import styled from 'styled-components';

export const ProposalCountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SocialPosterContainer = styled.div`
  max-width: 500px;
`;

export const MediaWrapper = styled(Col)`
  position: relative;
`;

export const MediaDeleteButton = styled(Button)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
`;

export const EachThreadContainer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  .thread-col-2 {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    width: 160px;
  }
`;

export const Media = styled(Image)`
  object-fit: contain;
`;
