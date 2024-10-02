import { Flex, List } from 'antd';
import Link from 'next/link';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { COLOR } from 'libs/ui-theme/src';

const StyledLink = styled.a`
  text-decoration: underline;
  color: ${COLOR.SECONDARY};
`;

const NextStyledLink = styled(Link)`
  text-decoration: underline;
  color: ${COLOR.SECONDARY};
`;

const SvmDeposit = () => (
  <>
    Deposit SOL or WSOL and OLAS tokens using the Lockbox via{' '}
    <NextStyledLink href="/manage-solana-products">manage Solana products</NextStyledLink> to get
    fungible tokens representing{' '}
    <StyledLink
      href="https://www.orca.so/liquidity?address=5dMKUYJDsjZkAD3wiV3ViQkuq9pSmWQ5eAzcQLtDnUT3"
      target="_blank"
      rel="noopener noreferrer"
    >
      full range WSOL-OLAS LP positions on Orca
    </StyledLink>{' '}
    WSOL-OLAS pool.
  </>
);

const PathContent = ({ path: { bond, network, exchange, bridge }, networkId, isEthereumPath }) => {
  const steps = [
    <>
      Check if there are{' '}
      <NextStyledLink href="/bonding-products">{` profitable ${bond.lpTokenName} products`}</NextStyledLink>{' '}
      available.
    </>,
    <>
      Get OLAS on {network}. You can acquire it on{' '}
      <StyledLink href={exchange.url} target="_blank" rel="noopener noreferrer">
        {exchange.name}
      </StyledLink>
      {` directly on ${network}, or `}
      <StyledLink href="https://app.uniswap.org/" target="_blank" rel="noopener noreferrer">
        buy it on Ethereum Uniswap
      </StyledLink>{' '}
      and{' '}
      <StyledLink href={bridge?.url} target="_blank" rel="noopener noreferrer">
        bridge it with {bridge?.name}
      </StyledLink>
      .
      {bond?.guideUrl && (
        <>
          {` For more information on how to bridge with the ${bridge?.name}, see this `}
          <StyledLink href={bond.guideUrl} target="_blank" rel="noopener noreferrer">
            guide
          </StyledLink>
          .
        </>
      )}
    </>,
    <>
      Get{' '}
      {bond.lpPairTokenTickerLink ? (
        <StyledLink href={bond.lpPairTokenTickerLink} target="_blank" rel="noopener noreferrer">
          {bond.lpPairTokenTicker}
        </StyledLink>
      ) : (
        bond.lpPairTokenTicker
      )}
      {` on ${network}. You can acquire it on ${exchange.name} directly on ${network}.`}
    </>,
    <>
      {networkId === 'solana' ? (
        <SvmDeposit />
      ) : (
        <>
          Pool OLAS and {bond.lpPairTokenTicker} tokens into the{' '}
          <StyledLink href={exchange.url} target="_blank" rel="noopener noreferrer">
            {`${bond.lpTokenName} pool on ${network} ${exchange.name}`}
          </StyledLink>
          .
        </>
      )}
    </>,
    <>{`Await receipt of LP tokens representing your stake in the ${bond.lpTokenName} pool.`}</>,
    <>
      {`Bridge ${bond.lpTokenName} ${
        bond.isFungible ? 'LP fungible' : ''
      } tokens from ${network} to Ethereum using `}
      <StyledLink href={bond.lpTokenBridge?.url} target="_blank" rel="noopener noreferrer">
        {bond.lpTokenBridge?.name}
      </StyledLink>
      .
    </>,
    <>
      <NextStyledLink href="/bonding-products">Bond LP tokens</NextStyledLink>
      .
    </>,
  ];

  const ethereumSteps = [
    <>
      Check if there are{' '}
      <NextStyledLink href="/bonding-products">{` profitable ${bond.lpTokenName} products`}</NextStyledLink>{' '}
      available.
    </>,
    <>
      {`Get OLAS on ${network}. You can acquire it on `}
      <StyledLink href={exchange.url} target="_blank" rel="noopener noreferrer">
        {exchange.name}
      </StyledLink>
      {` directly on ${network}.`}
    </>,
    <>{`Get ${bond.lpPairTokenTicker} on ${network}.`}</>,
    <>
      Pool OLAS and {bond.lpPairTokenTicker} tokens into the{' '}
      <StyledLink href={exchange.url} target="_blank" rel="noopener noreferrer">
        {`${bond.lpTokenName} pool on ${network} ${exchange.name}`}
      </StyledLink>
      .
    </>,
    <>Await receipt of LP tokens representing your stake in the {bond.lpTokenName} pool.</>,
    <>
      Bond LP tokens using <NextStyledLink href="/bonding-products">Olas Tokenomics</NextStyledLink>
      .
    </>,
  ];

  return (
    <List
      size="large"
      bordered
      dataSource={isEthereumPath ? ethereumSteps : steps}
      renderItem={(item, i) => (
        <List.Item>
          <Flex gap={16} align="top">
            <span>{i + 1}.</span>
            <span>{item}</span>
          </Flex>
        </List.Item>
      )}
    />
  );
};

PathContent.propTypes = {
  path: PropTypes.shape({
    bond: PropTypes.shape({
      guideUrl: PropTypes.string.isRequired,
      lpTokenName: PropTypes.string.isRequired,
      lpPairTokenTicker: PropTypes.string.isRequired,
      lpPairTokenTickerLink: PropTypes.string,
      lpTokenBridge: PropTypes.shape({
        url: PropTypes.string,
        name: PropTypes.string,
      }),
      isFungible: PropTypes.bool,
    }).isRequired,
    network: PropTypes.string.isRequired,
    exchange: PropTypes.shape({
      url: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    bridge: PropTypes.shape({
      url: PropTypes.string,
      name: PropTypes.string,
    }),
  }).isRequired,
  networkId: PropTypes.string.isRequired,
  isEthereumPath: PropTypes.bool.isRequired,
};

export default PathContent;
