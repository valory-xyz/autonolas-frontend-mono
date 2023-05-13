import { Skeleton } from 'antd/lib';
import PropTypes from 'prop-types';

export const Shimmer = ({ active = true }) => (
  <Skeleton.Input active={active} block />
);

Shimmer.propTypes = { active: PropTypes.bool };

Shimmer.defaultProps = { active: true };
