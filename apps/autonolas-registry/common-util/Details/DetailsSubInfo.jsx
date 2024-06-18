import { Alert, Button, Typography } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useEnsName } from 'wagmi';

import { NA } from '@autonolas/frontend-library';

import {
  DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
  HASH_DETAILS_STATE,
  NAV_TYPES,
} from '../../util/constants';
import { useHelpers } from '../hooks';
import { useMetadata } from '../hooks/useMetadata';
import { typePropType } from '../propTypes';
import { Circle } from '../svg/Circle';
import { NftImage } from './NFTImage';
import { useOperatorWhitelistComponent } from './ServiceDetails/useOperatorWhitelistComponent';
import {
  ArrowLink,
  EachSection,
  Info,
  SectionContainer,
  ServiceStatusContainer,
  SubTitle,
} from './styles';
import { getTokenDetailsRequest } from './utils';

const { Link, Text } = Typography;

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

const MetadataUnpinnedMessage = () => (
  <Alert message="Metadata is unpinned from IPFS server" type="warning" showIcon />
);

/**
 * Displays view hash and view code buttons redirecting to
 * links respectively
 */
const ViewHashAndCode = ({ type, metadataLoadState, hashUrl, codeHref }) => {
  if (HASH_DETAILS_STATE.LOADED !== metadataLoadState) return null;

  return (
    <>
      {type === NAV_TYPES.SERVICE && <>&nbsp;•&nbsp;</>}
      <Link target="_blank" data-testid="view-hash-link" href={hashUrl}>
        View Hash&nbsp;
        <ArrowLink />
      </Link>
      &nbsp;•&nbsp;
      <Link target="_blank" data-testid="view-code-link" href={codeHref}>
        View Code&nbsp;
        <ArrowLink />
      </Link>
    </>
  );
};
ViewHashAndCode.propTypes = {
  type: typePropType,
  metadataLoadState: PropTypes.string,
  hashUrl: PropTypes.string,
  codeHref: PropTypes.string,
};
ViewHashAndCode.defaultProps = {
  type: null,
  metadataLoadState: '',
  hashUrl: '',
  codeHref: '',
};

/**
 * Agent | Component | Service - details component
 */
export const DetailsSubInfo = ({
  id,
  isOwner,
  type,
  tokenUri,

  // other details 👇
  ownerAddress,
  componentAndAgentDependencies,
  serviceThreshold,
  serviceCurrentState,

  openUpdateHashModal,
  handleHashUpdate,
  navigateToDependency,
}) => {
  const { isSvm, doesNetworkHaveValidServiceManagerToken } = useHelpers();
  const [tokenAddress, setTokenAddress] = useState(null);

  const { data: ownerEnsName } = useEnsName({ address: ownerAddress, chainId: 1 });

  const { hashUrl, metadataLoadState, codeHref, nftImageUrl, description, version } =
    useMetadata(tokenUri);

  // get operator whitelist component
  const { operatorWhitelistTitle, operatorWhitelistValue, operatorStatusValue } =
    useOperatorWhitelistComponent(id);

  // get token address for service
  useEffect(() => {
    const fetchData = async () => {
      if (type === NAV_TYPES.SERVICE) {
        try {
          const response = await getTokenDetailsRequest(id);
          setTokenAddress(response.token);
        } catch (error) {
          console.error(error);
        }
      }
    };

    // token details is only available for L1 networks
    if (id && doesNetworkHaveValidServiceManagerToken && !isSvm) {
      fetchData();
    }
  }, [id, type, isSvm, doesNetworkHaveValidServiceManagerToken]);

  const viewHashAndCodeButtons = (
    <ViewHashAndCode
      type={type}
      metadataLoadState={metadataLoadState}
      hashUrl={hashUrl}
      codeHref={codeHref}
    />
  );

  /**
   * contains common details for agent, component & service
   * ie, description, version, metadata unpinned alert, owner address
   */
  const commonDetails = useMemo(() => {
    const details = [];

    if (HASH_DETAILS_STATE.LOADED === metadataLoadState) {
      details.push(
        { title: 'Description', dataTestId: 'description', value: description },
        { title: 'Version', dataTestId: 'version', value: version },
      );
    }

    // If metadata failed, that means it has been unpinned from IPFS
    // and show an alert indicating the user
    if (HASH_DETAILS_STATE.FAILED === metadataLoadState) {
      details.push({
        dataTestId: 'metadata-failed-to-load',
        value: <MetadataUnpinnedMessage />,
      });
    }

    details.push({
      title: 'Owner Address',
      dataTestId: 'owner-address',
      value: ownerAddress,
    });

    ownerEnsName &&
      details.push({
        title: 'Owner ENS Name',
        dataTestId: 'owner-ens-name',
        value: ownerEnsName,
      });

    return details;
  }, [description, metadataLoadState, ownerAddress, ownerEnsName, version]);

  const getComponentAndAgentValues = () => {
    const updateHashButton = isOwner ? (
      <>
        &nbsp;•&nbsp;
        {handleHashUpdate && (
          <Button type="primary" ghost onClick={openUpdateHashModal}>
            Update Hash
          </Button>
        )}
      </>
    ) : null;

    const getDependencyList = () => {
      if ((componentAndAgentDependencies || []).length === 0) return 'None';
      return componentAndAgentDependencies.map((e) => (
        <li key={`${type}-dependency-${e}`}>
          <Button type="link" onClick={() => navigateToDependency(e)}>
            {e}
          </Button>
        </li>
      ));
    };

    return [
      {
        dataTestId: 'hashes-list',
        value: (
          <>
            {viewHashAndCodeButtons}
            {updateHashButton}
          </>
        ),
      },
      ...commonDetails,
      {
        title: 'Component Dependencies',
        dataTestId: 'details-dependency',
        value: getDependencyList(),
      },
    ];
  };

  /**
   * contains details for service
   * ie, service status, NFT Image, threshold, token address, operator whitelisting
   */
  const getServiceValues = () => {
    const serviceState = ['2', '3', '4'].includes(serviceCurrentState);
    const serviceDetailsList = [
      {
        dataTestId: 'hashes-list',
        value: (
          <>
            <ServiceStatus serviceState={serviceState} />
            {viewHashAndCodeButtons}
          </>
        ),
      },
    ];

    // show NFT image only if metadata is available,
    // also, NFT is not available for SVM
    if (HASH_DETAILS_STATE.LOADED === metadataLoadState && !isSvm) {
      serviceDetailsList.push({
        dataTestId: 'service-nft-image',
        value: <NftImage imageUrl={nftImageUrl} isSmallSize />,
      });
    }

    serviceDetailsList.push(...commonDetails, {
      title: 'Threshold',
      value: serviceThreshold,
    });

    // token address is only available for L1 networks
    if (
      doesNetworkHaveValidServiceManagerToken &&
      tokenAddress !== DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS &&
      !isSvm
    ) {
      serviceDetailsList.push({
        title: 'Token Address',
        value: tokenAddress || NA,
      });
    }

    // operator whitelisting is only available for L1 networks
    if (doesNetworkHaveValidServiceManagerToken && !isSvm) {
      serviceDetailsList.push({
        title: operatorWhitelistTitle,
        value: operatorWhitelistValue,
      });

      if (isOwner) {
        serviceDetailsList.push({
          title: 'Set operators statuses',
          value: operatorStatusValue,
        });
      }
    }

    return serviceDetailsList;
  };

  const details = type === NAV_TYPES.SERVICE ? getServiceValues() : getComponentAndAgentValues();

  return (
    <SectionContainer>
      {details.map(({ title, value, dataTestId }, index) => (
        <EachSection key={`${type}-details-${index}`}>
          {title && <SubTitle strong>{title}</SubTitle>}
          <Info data-testid={dataTestId || ''}>{value}</Info>
        </EachSection>
      ))}
    </SectionContainer>
  );
};

DetailsSubInfo.propTypes = {
  id: PropTypes.string,
  isOwner: PropTypes.bool,
  type: typePropType,
  tokenUri: PropTypes.string,
  ownerAddress: PropTypes.string,
  componentAndAgentDependencies: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ),
  serviceThreshold: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  serviceCurrentState: PropTypes.string,
  handleHashUpdate: PropTypes.func,
  openUpdateHashModal: PropTypes.func,
  navigateToDependency: PropTypes.func,
};

DetailsSubInfo.defaultProps = {
  id: '',
  isOwner: false,
  type: null,
  tokenUri: '',
  ownerAddress: '',
  componentAndAgentDependencies: [],
  serviceThreshold: '',
  serviceCurrentState: '',
  handleHashUpdate: null,
  openUpdateHashModal: null,
  navigateToDependency: null,
};
