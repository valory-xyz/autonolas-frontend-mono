import {
  Button,
  Card,
  Col,
  Collapse,
  Flex,
  Grid,
  Row,
  Typography,
} from 'antd';
import Head from 'next/head';
import Image from 'next/image';
import { PropTypes } from 'prop-types';
import styled from 'styled-components';

import { COLOR } from '@autonolas/frontend-library';
import Address from 'components/Address';
import StyledMain from 'components/GlobalStyles/StyledMain';
import PathContent from 'components/PathContent';
import pathData from 'components/Paths/data.json';
import { OLAS_ETHEREUM_TOKEN_ADDRESS } from 'util/constants';
import { SITE } from 'util/meta';

const { useBreakpoint } = Grid;

const Upcase = styled(Typography.Text)`
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.07em;
`;

const StyledCard = styled(Card)`
  border-color: ${COLOR.BORDER_GREY};
  width: 100%;
  .ant-card-body {
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
`;

const StyledImageWrapper = styled.div`
  margin-bottom: 8px;
`;

const StyledPathButton = styled(Button)`
  margin-top: 16px;
`;

export const getServerSideProps = async (context) => {
  const { pathId } = context.params;
  const path = pathData.find((p) => p.id === `${pathId}`);

  if (!path) return { notFound: true };
  return {
    props: {
      path,
    },
  };
};

const PoolCollapseItem = ({
  path: {
    network, bond, bridge, exchange, networkId, address,
  }, isEthereumPath,
}) => (
  <Flex gap={16} vertical>
    {!isEthereumPath && (
      <Flex gap={4} vertical>
        <Upcase>
          OLAS address on Ethereum
        </Upcase>
        <Flex gap={8} align="center">
          <Address address={OLAS_ETHEREUM_TOKEN_ADDRESS} />
        </Flex>
      </Flex>
    )}
    {!isEthereumPath && (
      <Flex gap={4} vertical>
        <Upcase>
          Bridge OLAS from Ethereum to
          {' '}
          {network}
        </Upcase>
        <Flex gap={8} align="center">
          <a href={bridge?.url} target="_blank" rel="noopener noreferrer">
            {bridge?.name}
            {' '}
            ↗
          </a>
        </Flex>
      </Flex>
    )}
    <Flex gap={4} vertical>
      <Upcase>
        OLAS address on
        {' '}
        {network}
      </Upcase>
      <Flex gap={8} align="center">
        <Address address={address} networkId={networkId} />
      </Flex>
    </Flex>

    <Flex gap={4} vertical>
      <Upcase>
        Pool Exchange
      </Upcase>
      <Flex gap={8} align="center">
        <a href={exchange.url} target="_blank" rel="noopener noreferrer">
          {exchange.name}
          {' '}
          ↗
        </a>
      </Flex>
    </Flex>

    <Flex gap={4} vertical>
      <Upcase>
        Pool
      </Upcase>
      <Flex gap={8} align="center">
        <Address
          address={exchange.poolAddress}
          networkId={networkId}
          customExplorerUrl={exchange.lpTokenExplorer}
        />
      </Flex>
    </Flex>

    <Flex gap={4} vertical>
      <Upcase>
        LP Token
      </Upcase>
      <Flex gap={8} align="center">
        {`${bond.lpTokenName} ${bond.isFungible ? 'fungible token ' : ''}`}

        {/* TODO ensure LP token address is the same as poolAddress */}
        <Address
          address={exchange.lpTokenAddress || exchange.poolAddress}
          networkId={networkId}
        />
      </Flex>
    </Flex>
  </Flex>
);

PoolCollapseItem.propTypes = {
  path: PropTypes.shape({
    network: PropTypes.string.isRequired,
    bond: PropTypes.object.isRequired,
    bridge: PropTypes.object,
    exchange: PropTypes.object.isRequired,
    networkId: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
  }).isRequired,
  isEthereumPath: PropTypes.bool.isRequired,
};

const BridgeCollapseItem = ({
  path: {
    network, bond,
  }, isEthereumPath,
}) => (
  !isEthereumPath ? (
    <Flex gap={16} vertical>
      <Flex gap={4} vertical>
        <Upcase>
          Bridge from
          {' '}
          {network}
          {' '}
          to Ethereum
        </Upcase>
        <Flex gap={8} align="center">
          <a href={bond.lpTokenBridge.url} target="_blank" rel="noopener noreferrer">
            {bond.lpTokenBridge.name}
            {' '}
            ↗
          </a>
        </Flex>
      </Flex>
      <Flex gap={4} vertical>
        <Upcase>
          Bridged LP Token Address on Ethereum
        </Upcase>
        <Flex gap={8} align="center">
          Bridged
          {' '}
          {bond.lpTokenName}
          <Address address={bond.bridgedLpTokenAddress} />
        </Flex>
      </Flex>
    </Flex>
  ) : 'No bridging required.'
);

BridgeCollapseItem.propTypes = {
  path: PropTypes.shape({
    network: PropTypes.string.isRequired,
    bond: PropTypes.shape({
      lpTokenBridge: PropTypes.shape({
        url: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }).isRequired,
      lpTokenName: PropTypes.string.isRequired,
      bridgedLpTokenAddress: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  isEthereumPath: PropTypes.bool.isRequired,
};

const BondCollapseItem = () => (
  <Flex gap={16} vertical>
    <Flex gap={4} vertical>
      <Upcase>
        Bond LP Token into Olas Protocol
      </Upcase>
      <Flex gap={8} align="center">
        <StyledPathButton
          type="default"
          href="https://tokenomics.olas.network/bonding-products"
          target="_blank"
          rel="noopener noreferrer"
        >
          View available products
        </StyledPathButton>
      </Flex>
    </Flex>
  </Flex>
);

BondCollapseItem.propTypes = {
  path: PropTypes.shape({
    bond: PropTypes.object.isRequired,
  }).isRequired,
};

const PathDetailPage = ({
  path: {
    name, network, id, bond, networkId, customSubtitle,
  },
  path,
}) => {
  const isEthereumPath = networkId === 'ethereum';
  const { md } = useBreakpoint();

  const detailsItems = [
    {
      key: '1',
      label: 'Pool',
      children: <PoolCollapseItem path={path} isEthereumPath={isEthereumPath} />,
    },
    {
      key: '2',
      label: 'Bridge',
      children: <BridgeCollapseItem path={path} isEthereumPath={isEthereumPath} />,
    },
    {
      key: '3',
      label: 'Bond',
      children: <BondCollapseItem path={path} />,
    },
  ];

  return (
    <>
      <Head>
        <title>
          {name}
          {' '}
          |
          {' '}
          {SITE.TITLE}
        </title>
        <meta name="description" content={`Pool, Bridge, Bond. Everything you need to know how to bond into the Olas protocol with ${name}.`} />
      </Head>
      <StyledMain>
        <Row align="middle" className="mb-24" gutter={48}>
          <Col className={!md && 'mb-16'} xl={6} md={6} sm={8} xs={24}>
            <StyledCard>
              <StyledImageWrapper>
                <Image src={`/images/paths/${id}.svg`} alt={name} width={200} height={100} />
              </StyledImageWrapper>
            </StyledCard>
          </Col>

          <Col xl={18} md={18} sm={16} xs={24}>
            <div>
              <Typography.Title className="mt-0 mb-16" level={2}>
                {name}
              </Typography.Title>
              <Typography.Text>
                {customSubtitle || (
                  <>
                    {`Get ${bond.lpTokenName} LP tokens on ${network}. `}
                    {!isEthereumPath ? 'Bridge them to Ethereum and bond into the Olas protocol.' : 'Bond them into the Olas protocol.'}
                  </>
                )}
              </Typography.Text>
            </div>
          </Col>
        </Row>

        <Row gutter={[48, 48]}>
          <Col xs={24} lg={12}>
            <Typography.Title className="mt-0 mb-16" level={4}>
              Path
            </Typography.Title>

            <PathContent path={path} isEthereumPath={isEthereumPath} networkId={networkId} />
          </Col>
          <Col xs={24} md={12}>
            <Typography.Title className="mt-0 mb-16" level={4}>
              Details
            </Typography.Title>
            <Flex gap={32} vertical>
              <Collapse items={detailsItems} defaultActiveKey={['1', '2', '3']} />
            </Flex>
          </Col>
        </Row>
      </StyledMain>
    </>
  );
};

PathDetailPage.propTypes = {
  path: PropTypes.shape({
    name: PropTypes.string.isRequired,
    network: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    bond: PropTypes.shape({
      lpTokenName: PropTypes.string.isRequired,
      lpTokenBridge: PropTypes.shape({
        name: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
      }).isRequired,
      bridgedLpTokenAddress: PropTypes.string.isRequired,
    }).isRequired,
    networkId: PropTypes.string.isRequired,
    customSubtitle: PropTypes.string,
  }).isRequired,
};

export default PathDetailPage;
