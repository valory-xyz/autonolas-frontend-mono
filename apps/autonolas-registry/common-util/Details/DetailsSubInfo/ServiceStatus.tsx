import { Circle } from "common-util/svg/Circle";
import { ServiceStatusContainer } from "../styles";
import Text from "antd/es/typography/Text";

/**
 * Displays "service" status (active/inactive)
 */
const ServiceStatus = ({ serviceState=false }: { serviceState: boolean }) => (
    <ServiceStatusContainer
      className={serviceState ? 'active' : 'inactive'}
      data-testid="service-status"
    >
      <Circle size={8} />
      <Text>{serviceState ? 'Active' : 'Inactive'}</Text>
    </ServiceStatusContainer>
  );

  export default ServiceStatus;