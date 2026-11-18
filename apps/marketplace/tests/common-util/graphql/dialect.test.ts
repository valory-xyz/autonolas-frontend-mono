import {
  getMarketplaceDialect,
  getRegistryDialect,
  omitOnSquid,
  MARKETPLACE_SQUID_CHAIN_IDS,
  REGISTRY_SQUID_CHAIN_IDS,
} from 'common-util/graphql/dialect';
import { MARKETPLACE_SUBGRAPH_CLIENTS, REGISTRY_SUBGRAPH_CLIENTS } from 'common-util/graphql/index';
import { getServiceQuery } from 'common-util/graphql/registry';
import { getQueryForServiceActivity } from 'common-util/graphql/service-activity';
import {
  getQueryForSenderCounters,
  getQueryForServiceDetails,
  getQueryForServiceEndpoints,
} from 'common-util/graphql/services';

const squeeze = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('indexer dialects', () => {
  it.each([137, 8453] as const)('reads marketplace and registry on %s from squids', (chainId) => {
    expect(getMarketplaceDialect(chainId)).toBe('squid');
    expect(getRegistryDialect(chainId)).toBe('squid');
  });

  it('keeps Robinhood on squid and the other existing chains on Graph', () => {
    expect(getMarketplaceDialect(4663)).toBe('squid');
    expect(getRegistryDialect(4663)).toBe('squid');
    for (const chainId of [1, 10, 100, 42161] as const) {
      expect(getMarketplaceDialect(chainId)).toBe('graph');
      expect(getRegistryDialect(chainId)).toBe('graph');
    }
    expect(getRegistryDialect(34443)).toBe('graph');
    expect(getRegistryDialect(42220)).toBe('graph');
  });

  it('has clients for every migrated indexer', () => {
    for (const chainId of MARKETPLACE_SQUID_CHAIN_IDS) {
      expect(MARKETPLACE_SUBGRAPH_CLIENTS[chainId]).toBeDefined();
    }
    for (const chainId of REGISTRY_SQUID_CHAIN_IDS) {
      expect(REGISTRY_SUBGRAPH_CLIENTS[chainId]).toBeDefined();
    }
  });

  it('omitOnSquid drops only unsupported legacy fields', () => {
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
