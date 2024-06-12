import { Typography } from 'antd';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { getExplorerBaseUrl, truncateAddress } from 'util/helpers';
import { Copy } from './Copy';

const AddressText = styled(Typography.Text)`
  title: ${(props) => props.title};
`;

const Address = ({ address, networkId, customExplorerUrl }) => {
  const explorerBaseUrl = customExplorerUrl ?? getExplorerBaseUrl(networkId);

  const explorerUrl = `${explorerBaseUrl}${address}`;

  return (
    <>
      <AddressText title={address}>
        <a href={explorerUrl} rel="noopener noreferrer" target="_blank">
          {truncateAddress(address)}
          {' '}
          ↗
        </a>
      </AddressText>
      &nbsp;
      <Copy copyText={address} />
    </>
  );
};

Address.propTypes = {
  address: PropTypes.string.isRequired,
  networkId: PropTypes.string,
  customExplorerUrl: PropTypes.string,
};

Address.defaultProps = {
  networkId: 'ethereum',
  customExplorerUrl: undefined,
};
export default Address;
