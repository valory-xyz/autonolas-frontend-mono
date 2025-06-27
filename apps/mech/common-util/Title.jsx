import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const { Title } = Typography;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    margin-top: 16px;
  }
`;

export const HeaderTitle = ({ title, description }) => (
  <TitleContainer>
    <Title level={2}>{title}</Title>
    {description && (
      <div>
        <Tooltip title={description} placement="bottomLeft">
          <InfoCircleOutlined style={{ fontSize: 24, position: 'relative', top: -3 }} />
        </Tooltip>
      </div>
    )}
  </TitleContainer>
);

HeaderTitle.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
};

HeaderTitle.defaultProps = {
  description: null,
};
