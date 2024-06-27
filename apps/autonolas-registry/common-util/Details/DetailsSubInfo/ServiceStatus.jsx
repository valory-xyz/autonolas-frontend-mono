import { Typography } from 'antd';
import { PropTypes } from 'prop-types';

import { Circle } from '../../../svg/Circle';
import { ServiceStatusContainer } from '../../styles';

const { Text } = Typography;

/**
 * Displays "service" status (active/inactive)
 */
const ServiceStatus = ({ serviceState }) => (
  <ServiceStatusContainer
    className={serviceState ? 'active' : 'inactive'}
    data-testid="service-status"
  >
    <Circle size={8} />
    <Text>{serviceState ? 'Active' : 'Inactive'}</Text>
  </ServiceStatusContainer>
);
ServiceStatus.propTypes = { serviceState: PropTypes.bool };
ServiceStatus.defaultProps = { serviceState: false };
