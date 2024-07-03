import { Typography } from 'antd';

import { Circle } from '../../svg/Circle';
import { ServiceStatusContainer } from '../styles';

const { Text } = Typography;

/**
 * Displays "service" status (active/inactive)
 */
export const ServiceStatus = ({ serviceState = false }: { serviceState: boolean }) => (
  <ServiceStatusContainer
    className={serviceState ? 'active' : 'inactive'}
    data-testid="service-status"
  >
    <Circle />
    <Text>{serviceState ? 'Active' : 'Inactive'}</Text>
  </ServiceStatusContainer>
);
