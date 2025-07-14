import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'https://api.thegraph.com/subgraphs/name/protofire/omen-xdai',
});

const link = httpLink;

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

export default client;
