import { getSubgraphDialect, omitOnSquid, SQUID_CHAIN_IDS } from 'common-util/graphql/dialect';
import {
  MARKETPLACE_SUBGRAPH_CLIENTS,
  REGISTRY_SUBGRAPH_CLIENTS,
  type MarketplaceSubgraphChainId,
  type RegistrySubgraphChainId,
} from 'common-util/graphql/index';
import { getServiceQuery } from 'common-util/graphql/registry';
import { getQueryForServiceActivity } from 'common-util/graphql/service-activity';
import {
  getQueryForSenderCounters,
  getQueryForServiceDetails,
  getQueryForServiceEndpoints,
} from 'common-util/graphql/services';

const squeeze = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('getSubgraphDialect', () => {
  it('maps Robinhood to the squid dialect and every other chain to The Graph', () => {
    expect(SQUID_CHAIN_IDS).toEqual([4663]);
    expect(getSubgraphDialect(4663)).toBe('squid');
    const graphChains: (MarketplaceSubgraphChainId | RegistrySubgraphChainId)[] = [
      1, 10, 100, 137, 8453, 34443, 42161, 42220,
    ];
    for (const chainId of graphChains) {
      expect(getSubgraphDialect(chainId)).toBe('graph');
    }
  });

  // A squid chain without a client entry would only fail at the first request.
  it('every squid chain has a marketplace and a registry client', () => {
    for (const chainId of SQUID_CHAIN_IDS) {
      expect(MARKETPLACE_SUBGRAPH_CLIENTS[chainId]).toBeDefined();
      expect(REGISTRY_SUBGRAPH_CLIENTS[chainId]).toBeDefined();
    }
  });

  it('omitOnSquid drops the fragment only on the squid', () => {
    expect(omitOnSquid('graph', 'mechs { id }')).toBe('mechs { id }');
    expect(omitOnSquid('squid', 'mechs { id }')).toBe('');
  });
});

describe('service endpoints query', () => {
  it('binds the id as a variable on both dialects', () => {
    const graph = squeeze(getQueryForServiceEndpoints('graph'));
    expect(graph).toContain('query ServiceEndpoints($id: ID!)');
    expect(graph).toContain('service(id: $id)');
    expect(graph).toContain('mech(id: $id)');
    expect(graph).toContain('mechs { id address }');

    const squid = squeeze(getQueryForServiceEndpoints('squid'));
    expect(squid).toContain('query ServiceEndpoints($id: String!)');
    expect(squid).toContain('serviceById(id: $id)');
    expect(squid).toContain('mechById(id: $id)');
    expect(squid).not.toContain('mechs {');
  });
});

describe('registry service query', () => {
  it('uses service(id: ID!) on The Graph', () => {
    const q = squeeze(getServiceQuery(true, 'graph'));
    expect(q).toContain('query Service($id: ID!)');
    expect(q).toContain('service(id: $id)');
    expect(q).toContain('erc8004Agent { id agentWallet }');
  });

  it('uses serviceById(id: String!) on the squid', () => {
    const q = squeeze(getServiceQuery(true, 'squid'));
    expect(q).toContain('query Service($id: String!)');
    expect(q).toContain('serviceById(id: $id)');
    expect(q).not.toContain(' service(id');
  });

  it('omits the ERC-8004 fields when not requested', () => {
    expect(squeeze(getServiceQuery(false, 'squid'))).not.toContain('erc8004Agent');
  });
});

describe('service details query', () => {
  it('keeps first / meches / service.mechs on The Graph', () => {
    const q = squeeze(getQueryForServiceDetails({ serviceIds: ['1', '2'], dialect: 'graph' }));
    expect(q).toContain('services( first: 1000');
    expect(q).toContain('mechs { id address }');
    expect(q).toContain('meches( first: 1000');
    expect(q).toContain('id_in: ["1", "2"]');
  });

  it('uses limit and drops the legacy service.mechs on the squid; meches stays', () => {
    const q = squeeze(getQueryForServiceDetails({ serviceIds: ['1'], dialect: 'squid' }));
    expect(q).toContain('services( limit: 1000');
    expect(q).not.toContain('first:');
    expect(q).not.toContain('mechs { id address }');
    expect(q).toContain('meches( limit: 1000');
    expect(q).toContain('totalDeliveriesTransactions');
  });
});

describe('sender counters query', () => {
  it('switches the page argument by dialect', () => {
    expect(squeeze(getQueryForSenderCounters({ multisigs: ['0xa'], dialect: 'graph' }))).toContain(
      'first: 1000',
    );
    expect(squeeze(getQueryForSenderCounters({ multisigs: ['0xa'], dialect: 'squid' }))).toContain(
      'limit: 1000',
    );
  });
});

describe('service activity query', () => {
  it('uses The Graph filter, paging and ordering, with the id as an ID! variable', () => {
    const q = squeeze(getQueryForServiceActivity('graph'));
    expect(q).toContain('query ServiceActivity($serviceId: ID!)');
    expect(q).toContain(
      'delivers (where: {service_: {id: $serviceId}}, first: 1000, orderBy: blockTimestamp, orderDirection: desc)',
    );
    expect(q).toContain(
      'requests (where: {service_: {id: $serviceId}}, first: 1000, orderBy: blockTimestamp, orderDirection: desc)',
    );
    expect(q).toContain('mechDelivery { ipfsHash }');
    expect(q).toContain('mechRequest { ipfsHash }');
  });

  it('uses the OpenReader filter, paging and ordering and no legacy fields on the squid', () => {
    const q = squeeze(getQueryForServiceActivity('squid'));
    expect(q).toContain('query ServiceActivity($serviceId: String!)');
    expect(q).toContain(
      'delivers (where: {service: {id_eq: $serviceId}}, limit: 1000, orderBy: blockTimestamp_DESC)',
    );
    expect(q).toContain(
      'requests (where: {service: {id_eq: $serviceId}}, limit: 1000, orderBy: blockTimestamp_DESC)',
    );
    expect(q).not.toContain('mechDelivery');
    expect(q).not.toContain('mechRequest');
    expect(q).not.toContain('orderDirection');
    // the marketplace-era payload fields stay
    expect(q).toContain('marketplaceDelivery { ipfsHashBytes deliveryRate }');
    expect(q).toContain('marketplaceRequest { ipfsHashBytes }');
  });
});
