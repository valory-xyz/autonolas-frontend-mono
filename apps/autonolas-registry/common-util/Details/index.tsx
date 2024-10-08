import { Button, Col, Row, Typography } from 'antd';
import capitalize from 'lodash/capitalize';
import get from 'lodash/get';
import { FC, useCallback, useState } from 'react';
import { Address } from 'viem';

import { GenericObject, Loader, NA } from '@autonolas/frontend-library';

import { NAV_TYPES, NavTypesValues } from 'util/constants';

import { IpfsHashGenerationModal } from '../List/IpfsHashGenerationModal';
import { useHelpers } from '../hooks';
import { useMetadata } from '../hooks/useMetadata';
import { DetailsSubInfo } from './DetailsSubInfo';
import { NftImage } from './NFTImage';
import { DetailsTitle, Header } from './styles';
import { useDetails } from './useDetails';

const { Text } = Typography;

type DetailsProps = {
  id: string;
  type: NavTypesValues;
  getDetails: (id: string) => Promise<{ unitHash: Address; dependencies: string[] }>;
  getTokenUri: (id: string) => Promise<string>;
  getOwner: (id: string) => Promise<string>;
  handleUpdate?: () => void;
  handleHashUpdate?: () => void;
  navigateToDependency?: (id: string, type: NavTypesValues) => void;
  renderServiceState?: (props: {
    isOwner: boolean;
    details: GenericObject;
    updateDetails: (details: GenericObject) => void;
  }) => JSX.Element | null;
};

export const Details: FC<DetailsProps> = ({
  id,
  type,
  getDetails,
  getTokenUri,
  getOwner,
  handleUpdate,
  handleHashUpdate,
  navigateToDependency,
  renderServiceState,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { isMainnet } = useHelpers();
  const { isLoading, isOwner, info, ownerAddress, tokenUri, updateDetails } = useDetails({
    id,
    type,
    getDetails,
    getOwner,
    getTokenUri,
  });
  const { nftImageUrl, packageName } = useMetadata(tokenUri);

  // Update button to be show only if the connected account is the owner
  // and only for services
  const canShowUpdateBtn = isOwner && type === NAV_TYPES.SERVICE && !!handleUpdate;

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
              <DetailsTitle level={2}>{`${capitalize(type)} ID ${id}`}</DetailsTitle>
            </>
          )}
        </div>

        <div className="right-content">
          {canShowUpdateBtn && (
            <Button
              size="large"
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
            ownerAddress={ownerAddress || NA}
            componentAndAgentDependencies={get(info, 'dependencies')}
            serviceThreshold={get(info, 'threshold') || NA}
            serviceCurrentState={get(info, 'state') || NA}
            handleHashUpdate={handleHashUpdate}
            openUpdateHashModal={openUpdateHashModal}
            navigateToDependency={navigateToDependency}
          />
        </Col>

        <Col md={12} xs={24}>
          {type === NAV_TYPES.SERVICE ? (
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
