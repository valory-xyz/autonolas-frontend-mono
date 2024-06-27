import { useState, useCallback } from 'react';
import { Row, Col, Button, Typography } from 'antd';
import capitalize from 'lodash/capitalize';
import { GenericObject, Loader } from '@autonolas/frontend-library';

import { useMetadata } from '../hooks/useMetadata';
import { useHelpers } from '../hooks';
import { IpfsHashGenerationModal } from '../List/IpfsHashGenerationModal';
import { useDetails } from './useDetails';
import { NftImage } from './NFTImage';
import { DetailsSubInfo } from './DetailsSubInfo';
import { Header, DetailsTitle } from './styles';

import { NavType } from 'util/enum';
import { Address } from 'viem';
import BigNumber from 'bignumber.js';

const { Text } = Typography;

type DetailsProps = {
  id: BigNumber;
  type: NavType;
  getDetails: (id: BigNumber) => Promise<GenericObject>; // TODO: Define the return type
  getTokenUri: (id: BigNumber) => Promise<string>;
  getOwner: (id: BigNumber) => Promise<Address>;
  handleUpdate: () => void;
  handleHashUpdate: () => void;
  navigateToDependency: (id: BigNumber, type: NavType) => void;
  renderServiceState: (props: {
    isOwner: boolean;
    details: GenericObject;
    updateDetails: (details: GenericObject) => void;
  }) => JSX.Element | null;
};

export const Details = ({
  id,
  type,
  getDetails,
  getTokenUri,
  getOwner,
  handleUpdate,
  handleHashUpdate,
  navigateToDependency,
  renderServiceState,
}: DetailsProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { isMainnet } = useHelpers();
  const { isLoading, isOwner, info, ownerAddress, tokenUri, updateDetails } =
    useDetails({
      id,
      type,
      getDetails,
      getOwner,
      getTokenUri,
    });
  const { nftImageUrl, packageName } = useMetadata(tokenUri);

  // Update button to be show only if the connected account is the owner
  // and only for services
  const canShowUpdateBtn =
    isOwner && type === NavType.SERVICE && !!handleUpdate;

  const openUpdateHashModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  if (isLoading) {
    return <Loader timeoutMessage="Details couldn’t be loaded" />;
  }

  return (
    <>
      <Header>
        <div>
          {isMainnet ? (
            <DetailsTitle level={3}>{packageName}</DetailsTitle>
          ) : (
            <>
              <Text strong>{`${capitalize(type)} Name`}</Text>
              <DetailsTitle level={2}>
                {`${capitalize(type)} ID ${id}`}
              </DetailsTitle>
            </>
          )}
        </div>

        <div className="right-content">
          {canShowUpdateBtn && (
            <Button
              type="primary"
              ghost
              onClick={handleUpdate}
              data-testid="service-update-button"
            >
              Update
            </Button>
          )}
        </div>
      </Header>

      <Row>
        <Col md={12} xs={24}>
          <DetailsSubInfo
            id={id}
            isOwner={isOwner}
            type={type}
            tokenUri={tokenUri}
            ownerAddress={ownerAddress}
            componentAndAgentDependencies={info?.dependencies ?? []}
            serviceThreshold={info?.threshold ?? []}
            serviceCurrentState={info?.state ?? []}
            handleHashUpdate={handleHashUpdate}
            openUpdateHashModal={openUpdateHashModal}
            navigateToDependency={navigateToDependency}
          />
        </Col>

        <Col md={12} xs={24}>
          {type === NavType.SERVICE ? (
            <>
              {renderServiceState
                ? renderServiceState({ isOwner, details: info, updateDetails })
                : null}
            </>
          ) : (
            // NftImage for "service" is shown in `DetailsSubInfo` component
            // in the left column & for "agent" and "component" is shown here
            <NftImage imageUrl={nftImageUrl} />
          )}
        </Col>
      </Row>

      {isModalVisible && (
        <IpfsHashGenerationModal
          visible={isModalVisible}
          type={type}
          handleHashUpdate={handleHashUpdate}
          handleCancel={() => setIsModalVisible(false)}
        />
      )}
    </>
  );
};

export default Details;
