import { Typography, Tooltip } from 'antd/lib';
import { InfoCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { COLOR } from 'util/theme';

const { Title } = Typography;

const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    color: ${COLOR.PRIMARY};
  }
`;

export const HeaderTitle = ({ title, description }) => (
  <TitleContainer>
    <Title level={2}>{title}</Title>
    {description && (
      <div>
        <Tooltip title={description} placement="bottomLeft">
          <InfoCircleOutlined
            style={{ fontSize: 24, position: 'relative', top: -6 }}
          />
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
