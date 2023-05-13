import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Typography, Tooltip } from 'antd/lib';
import { COLOR } from '@autonolas/frontend-library';
import { Shimmer } from '../Shimmer';

const { Title, Paragraph } = Typography;

const InfoCardContainer = styled.div`
  h5 {
    min-height: 31.5px;
  }
`;

const ValueText = styled.div`
  font-style: normal;
  font-weight: 400;
  font-size: 48px;
  line-height: 58px;
  min-height: 58px;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
  cursor: help;

  /* ellipsis */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const InfoCard = ({
  isLoading,
  title,
  value,
  tooltipValue,
  subText,
  hideTitle,
  avoidLogin = false,
  ...rest
}) => {
  const isLoggedIn = avoidLogin
    ? true
    : !!useSelector((state) => state?.setup?.account);

  return (
    <InfoCardContainer {...rest}>
      {!hideTitle && <Title level={5}>{title || ''}</Title>}

      <ValueText>
        {isLoading ? (
          <Shimmer />
        ) : (
          <Tooltip
            placement="topLeft"
            title={isLoggedIn ? tooltipValue || value : '--'}
            color={COLOR.BLACK}
          >
            {isLoggedIn ? value : '--'}
          </Tooltip>
        )}
      </ValueText>

      <Paragraph>{subText || ' '}</Paragraph>
    </InfoCardContainer>
  );
};

InfoCard.propTypes = {
  isLoading: PropTypes.bool,
  title: PropTypes.string,
  hideTitle: PropTypes.bool,
  value: PropTypes.string,
  tooltipValue: PropTypes.string,
  subText: PropTypes.string,
  /**
   * if the user is not logged in, instead of the actual value,
   * it will show '--'
   */
  avoidLogin: PropTypes.bool,
};

InfoCard.defaultProps = {
  isLoading: false,
  title: null,
  hideTitle: false,
  value: null,
  tooltipValue: null,
  subText: null,
  avoidLogin: false,
};
