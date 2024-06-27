import { Alert, Button } from 'antd';
import { isNil } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useEnsName } from 'wagmi';

import { TOKENOMICS } from 'libs/util-contracts/src/lib/abiAndAddresses/tokenomics';

import { getTokenomicsContract } from 'common-util/Contracts';
import { DetailsValue } from 'types/index';

import { DEFAULT_SERVICE_CREATION_ETH_TOKEN_ZEROS, TOKENOMICS_UNITS } from '../../../util/constants';
import { HashDetailsState, NavType } from '../../../util/enum';
import { useHelpers } from '../../hooks';
import { useMetadata } from '../../hooks/useMetadata';
import { EachSection, Info, SectionContainer, SubTitle } from '../styles';
import { NftImage } from './../NFTImage';
import { useOperatorWhitelistComponent } from './../ServiceDetails/useOperatorWhitelistComponent';
import RewardsSection from './RewardsSection';
import ServiceStatus from './ServiceStatus';
import ViewHashAndCode from './ViewHashAndCode';
import {
  formatOwnerIncentive,
  getTokenDetailsRequest,
  isDetailsValueDependency,
  isDetailsValueRewards,
} from './utils';
import BigNumber from 'bignumber.js';

const tokenomicsContract = getTokenomicsContract(TOKENOMICS.addresses[mainnet.id]);

const getOwnerIncentives = async (
  account: Address,
  unitTypes: BigNumber[],
  unitIds: BigNumber[],
) => {
  if (unitTypes.length !== unitIds.length) throw new Error('unitType and unitId length mismatch');
  return tokenomicsContract.methods.getOwnerIncentives(account, unitTypes, unitIds).call();
};

enum DetailsDataTestId {
  REWARD = 'details-rewards',
  DEPENDENCY = 'details-dependency',
}

const MetadataUnpinnedMessage = () => (
  <Alert message="Metadata is unpinned from IPFS server" type="warning" showIcon />
);

type RewardNavType = Omit<NavType, 'SERVICE'>;

type DetailsSubInfoProps = {
  id: BigNumber;
  isOwner: boolean;
  type: NavType;
  tokenUri?: string;
  ownerAddress?: Address;
  componentAndAgentDependencies: BigNumber[];
  serviceThreshold: string;
  serviceCurrentState: string;
  handleHashUpdate: () => void;
  openUpdateHashModal: () => void;
  navigateToDependency: (id: BigNumber, type: NavType) => void;
};
/**
 * Agent | Component | Service - details component
 */
export const DetailsSubInfo = ({
  id,
  isOwner,
  type,
  tokenUri,
  ownerAddress,
  componentAndAgentDependencies,
  serviceThreshold,
  serviceCurrentState,
  openUpdateHashModal,
  handleHashUpdate,
  navigateToDependency,
}: DetailsSubInfoProps) => {
  const { isSvm, doesNetworkHaveValidServiceManagerToken } = useHelpers();
  const [tokenAddress, setTokenAddress] = useState<Address | null>(null);
  const [formattedRewards, setFormattedRewards] = useState<{
    reward: string;
    topUp: string;
  }>();

  const { data: ownerEnsName } = useEnsName({ address: ownerAddress, chainId: 1 });

  const { hashUrl, metadataLoadState, codeHref, nftImageUrl, description, version } =
    useMetadata(tokenUri);

  // get operator whitelist component
  const { operatorWhitelistTitle, operatorWhitelistValue, operatorStatusValue } =
    useOperatorWhitelistComponent(id);

  const tokenomicsUnit = useMemo(() => {
    if (type === NavType.COMPONENT) return TOKENOMICS_UNITS.COMPONENT;
    if (type === NavType.AGENT) return TOKENOMICS_UNITS.AGENT;
    return null;
  }, [type]);

  const viewHashAndCodeButtons = (
    <ViewHashAndCode
      type={type}
      metadataLoadState={metadataLoadState as HashDetailsState}
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

    if (metadataLoadState === HashDetailsState.LOADED) {
      details.push(
        { title: 'Description', dataTestId: 'description', value: description },
        { title: 'Version', dataTestId: 'version', value: version },
      );
    }

    // If metadata failed, that means it has been unpinned from IPFS
    // and show an alert indicating the user
    if (HashDetailsState.FAILED === metadataLoadState) {
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

  const getComponentAndAgentValues = (): DetailsValue[] => {
    const updateHashButton = isOwner ? (
      <>
        &nbsp;•&nbsp;
        {!!handleHashUpdate && (
          <Button type="primary" ghost onClick={openUpdateHashModal}>
            Update Hash
          </Button>
        )}
      </>
    ) : null;

    const getDependencyList = () => {
      if (componentAndAgentDependencies.length === 0) return;
      return componentAndAgentDependencies.map((dependencyId) => (
        <li key={`${type}-dependency-${dependencyId}`}>
          <Button type="link" onClick={() => navigateToDependency(dependencyId, type)}>
            {`${dependencyId}`}
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
      ...(formattedRewards
        ? [
            {
              title: 'Rewards',
              dataTestId: 'details-rewards',
              value: formattedRewards,
            },
          ]
        : []),
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
  const getServiceValues = (): DetailsValue[] => {
    const serviceState = ['2', '3', '4'].includes(serviceCurrentState);

    const serviceDetailsList: DetailsValue[] = [
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
    if (HashDetailsState.LOADED === metadataLoadState && !isSvm) {
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
        value: tokenAddress,
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
    type === NavType.SERVICE ? getServiceValues() : getComponentAndAgentValues();

  const detailsSections = useMemo(
    () =>
      detailsValues.map((detailsValue: DetailsValue, index) => {
        const { title, dataTestId, value } = detailsValue;

        if (dataTestId === DetailsDataTestId.REWARD && !formattedRewards) return null;

        const isRewards = isDetailsValueRewards(detailsValue);
        const isDependency = isDetailsValueDependency(detailsValue);

        let key;
        if (isRewards) key = `${type}-details-${index}-rewards`;
        else if (isDependency) key = `${type}-details-${index}-dependency`;

        return (
          <EachSection key={key}>
            {title && <SubTitle strong>{title}</SubTitle>}
            {isRewards && <RewardsSection {...(value as { reward: string; topUp: string })} />}
            {isDependency && <Info data-testid={dataTestId}>{value as number}</Info>}
          </EachSection>
        );
      }),
    [detailsValues, formattedRewards, type],
  );

  // get token address for service
  useEffect(() => {
    const fetchData = async () => {
      if (type === NavType.SERVICE) {
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

  // load rewards into reward state
  useEffect(() => {
    if (type satisfies RewardNavType) if (formattedRewards) return;
    if (isNil(tokenomicsUnit) || isNil(id) || isNil(ownerAddress)) return;

    getOwnerIncentives(ownerAddress, [tokenomicsUnit], [id]).then((res) => {
      const ownerIncentive = res[0];
      setFormattedRewards(formatOwnerIncentive(ownerIncentive));
    });
  }, [formattedRewards, id, ownerAddress, tokenomicsUnit, type]);
  return <SectionContainer>{detailsSections}</SectionContainer>;
};

export default DetailsSubInfo;
