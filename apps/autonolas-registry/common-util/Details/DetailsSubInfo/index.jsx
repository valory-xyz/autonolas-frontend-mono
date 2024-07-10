import { Alert, Button } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useEnsName } from 'wagmi';

import { NA } from '@autonolas/frontend-library';

import { TOKENOMICS } from 'libs/util-contracts/src/lib/abiAndAddresses/tokenomics';

import { getTokenomicsContract } from 'common-util/Contracts';

import {
  DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS,
  HASH_DETAILS_STATE,
  NAV_TYPES,
} from '../../../util/constants';
import { useHelpers } from '../../hooks';
import { useMetadata } from '../../hooks/useMetadata';
import { typePropType } from '../../propTypes';
import { NftImage } from '../NFTImage';
import { useOperatorWhitelistComponent } from '../ServiceDetails/useOperatorWhitelistComponent';
import { EachSection, Info, SectionContainer, SubTitle } from '../styles';
import { getTokenDetailsRequest } from '../utils';
import { RewardsSection } from './RewardsSection';
import { ServiceStatus } from './ServiceStatus';
import { ViewHashAndCode } from './ViewHashAndCode';
import { useTokenomicsUnitType } from './hooks';

const navTypesForRewards = [NAV_TYPES.COMPONENT, NAV_TYPES.AGENT];

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
  const { isSvm, doesNetworkHaveValidServiceManagerToken, chainId } = useHelpers();
  const [tokenAddress, setTokenAddress] = useState(null);
  const [rewards, setRewards] = useState(null);

  const { data: ownerEnsName } = useEnsName({ address: ownerAddress, chainId: 1 });

  const { hashUrl, metadataLoadState, codeHref, nftImageUrl, description, version } =
    useMetadata(tokenUri);

  // get operator whitelist component
  const { operatorWhitelistTitle, operatorWhitelistValue, operatorStatusValue } =
    useOperatorWhitelistComponent(id);

  const tokenomicsUnitType = useTokenomicsUnitType(type);

  const tokenomicsContract =
    type === NAV_TYPES.SERVICE || isSvm ? null : getTokenomicsContract(TOKENOMICS.addresses[1]);

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
        value: <Alert message="Metadata is unpinned from IPFS server" type="warning" showIcon />,
      });
    }

    details.push({ title: 'Owner Address', dataTestId: 'owner-address', value: ownerAddress });

    if (ownerEnsName) {
      details.push({ title: 'Owner ENS Name', dataTestId: 'owner-ens-name', value: ownerEnsName });
    }

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
      ...(rewards ? [{ title: 'Rewards', dataTestId: 'details-rewards', value: rewards }] : []),
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

  const detailsValues =
    type === NAV_TYPES.SERVICE ? getServiceValues() : getComponentAndAgentValues();

  const detailsSections = useMemo(
    () =>
      detailsValues.map(({ title, value, dataTestId }, index) => {
        if (dataTestId === 'details-rewards' && !rewards) return null;

        const isRewards = dataTestId === 'details-rewards';

        return (
          <EachSection key={`${type}-details-${index}`}>
            {title && <SubTitle strong>{title}</SubTitle>}
            {value &&
              (isRewards ? (
                <RewardsSection {...value} data-testid={dataTestId} />
              ) : (
                <Info data-testid={dataTestId}>{value}</Info>
              ))}
          </EachSection>
        );
      }),
    [detailsValues, rewards, type],
  );

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

  // Load rewards into state on Ethereum
  useEffect(() => {
    if (chainId !== 1) return;

    if (rewards) return;
    if (!navTypesForRewards.includes(type)) return;
    if (!ownerAddress) return;
    if (!id) return;
    if (!tokenomicsContract) return;

    tokenomicsContract.methods
      .getOwnerIncentives(ownerAddress, [tokenomicsUnitType], [id])
      .call()
      .then(({ reward, topUp }) => setRewards({ reward, topUp }))
      .catch((error) => console.error(error));
  }, [rewards, id, ownerAddress, tokenomicsUnitType, type, tokenomicsContract, chainId]);

  return <SectionContainer>{detailsSections}</SectionContainer>;
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
