import { Skeleton } from 'antd';
import PropTypes from 'prop-types';

export const Shimmer = ({ active = true }) => (
  <Skeleton.Input active={active} block />
);

Shimmer.propTypes = { active: PropTypes.bool };

Shimmer.defaultProps = { active: true };
